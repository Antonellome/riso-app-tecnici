import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Calendar, Share2, ChevronDown, Eye } from 'lucide-react-native';
import { Stack } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import type { ShiftType, Report as ReportType } from '@/types';
import { getTodayISO, formatDate } from '@/utils/dateFormat';
import DatePicker from '@/components/DatePicker';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
let Sharing: any = null;
if (Platform.OS !== 'web') {
  Sharing = require('expo-sharing');
}
import * as XLSX from 'xlsx';
import { router } from 'expo-router';

export default function ReportsScreen() {
  const { reports, settings, calculateHours } = useApp();
  const currentDate = new Date();
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );
  const [showReportTypePicker, setShowReportTypePicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [reportTypeZIndex, setReportTypeZIndex] = useState(1);
  const [monthZIndex, setMonthZIndex] = useState(1);

  const monthlyStats = useMemo(() => {
    const monthReports = reports.filter(r => r.date.startsWith(selectedMonth));
    
    let totalHours = 0;
    let totalEarnings = 0;
    const hoursByType: Partial<Record<ShiftType, number>> = {};
    const earningsByType: Partial<Record<ShiftType, number>> = {};

    monthReports.forEach(report => {
      const hours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
      const rate = settings.work.hourlyRates.find(hr => hr.type === report.shiftType)?.rate || 0;
      const earnings = hours * rate;

      totalHours += hours;
      totalEarnings += earnings;

      hoursByType[report.shiftType] = (hoursByType[report.shiftType] || 0) + hours;
      earningsByType[report.shiftType] = (earningsByType[report.shiftType] || 0) + earnings;
    });

    return {
      totalHours,
      totalEarnings,
      hoursByType,
      earningsByType,
      reportCount: monthReports.length,
    };
  }, [reports, selectedMonth, calculateHours, settings.work.hourlyRates]);

  const generateDailyReportHTML = (report: ReportType) => {
    const userHours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
    
    const techniciansHours = report.technicians
      .map(tech => ({
        name: tech.name,
        startTime: tech.startTime,
        endTime: tech.endTime,
        pause: report.pauseMinutes,
        hours: calculateHours(tech.startTime, tech.endTime, report.pauseMinutes),
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const totalTechniciansHours = techniciansHours.reduce((sum, tech) => sum + tech.hours, 0);
    const totalReportHours = userHours + totalTechniciansHours;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Report Giornaliero</title>
          <style>
            @page { size: A4 portrait; margin: 0.8cm; }
            body { font-family: Arial, sans-serif; padding: 10px; max-width: 21cm; margin: 0 auto; }
            .header { margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; }
            .title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 3px; text-align: center; }
            .subtitle { font-size: 13px; font-weight: 600; color: #374151; text-align: center; }
            .info-section { margin-bottom: 10px; background-color: #f9fafb; padding: 8px; border-radius: 4px; }
            .info-row { display: flex; margin-bottom: 4px; }
            .info-label { font-size: 10px; font-weight: 600; color: #6b7280; width: 100px; }
            .info-value { font-size: 10px; color: #111827; }
            .section { margin-bottom: 10px; }
            .section-title { font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; border-radius: 4px; overflow: hidden; }
            th { background-color: #2563eb; color: white; padding: 5px 4px; text-align: center; font-size: 9px; font-weight: bold; }
            td { padding: 5px 4px; border-bottom: 1px solid #e5e7eb; font-size: 9px; color: #111827; text-align: center; }
            .user-row { background-color: #eff6ff; }
            .technician-col { text-align: left; }
            .text-box { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; min-height: 40px; }
            .text-content { font-size: 9px; color: #374151; line-height: 13px; }
            .summary-table { background-color: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px; padding: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb; }
            .summary-label { font-size: 10px; color: #6b7280; font-weight: 500; }
            .summary-value { font-size: 10px; color: #111827; font-weight: 600; }
            .total-row { border-bottom: none; border-top: 2px solid #2563eb; margin-top: 4px; padding-top: 6px; }
            .total-label { font-size: 11px; color: #111827; font-weight: bold; }
            .total-value { font-size: 11px; color: #2563eb; font-weight: bold; }
            .footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
            .footer-text { font-size: 8px; color: #9ca3af; text-align: center; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Report Giornaliero di ${settings.user.name || '[Nome Utente]'}</div>
            <div class="subtitle">della ditta ${settings.user.company || '[Nome Ditta]'}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Data del Report:</div>
              <div class="info-value">${formatDate(report.date)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Nome della Nave:</div>
              <div class="info-value">${report.ship}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Luogo:</div>
              <div class="info-value">${report.location}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tecnici</div>
            <table>
              <thead>
                <tr>
                  <th class="technician-col">Tecnico</th>
                  <th>Ora Inizio</th>
                  <th>Ora Fine</th>
                  <th>Pausa</th>
                  <th>Ore Lavorate</th>
                </tr>
              </thead>
              <tbody>
                <tr class="user-row">
                  <td class="technician-col">${settings.user.name || '[Utente]'}</td>
                  <td>${report.startTime}</td>
                  <td>${report.endTime}</td>
                  <td>${report.pauseMinutes} min</td>
                  <td><strong>${userHours.toFixed(2)}h</strong></td>
                </tr>
                ${techniciansHours.map(tech => `
                  <tr>
                    <td class="technician-col">${tech.name}</td>
                    <td>${tech.startTime}</td>
                    <td>${tech.endTime}</td>
                    <td>${tech.pause} min</td>
                    <td><strong>${tech.hours.toFixed(2)}h</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Materiali Utilizzati</div>
            <div class="text-box">
              <div class="text-content">${report.materials || 'Nessun materiale specificato'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Lavori Eseguiti</div>
            <div class="text-box">
              <div class="text-content">${report.workDone || 'Nessun lavoro specificato'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Riepilogo Ore</div>
            <div class="summary-table">
              <div class="summary-row">
                <div class="summary-label">Totale Ore Utente:</div>
                <div class="summary-value">${userHours.toFixed(2)}h</div>
              </div>
              <div class="summary-row">
                <div class="summary-label">Totale Ore Tecnici:</div>
                <div class="summary-value">${totalTechniciansHours.toFixed(2)}h</div>
              </div>
              <div class="summary-row total-row">
                <div class="total-label">Totale Ore Report:</div>
                <div class="total-value">${totalReportHours.toFixed(2)}h</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-text">Report generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</div>
          </div>
        </body>
      </html>
    `;
  };

  const generateMonthlyReportHTML = () => {
    const monthReports = reports.filter(r => r.date.startsWith(selectedMonth));
    
    let totalHours = 0;
    let totalEarnings = 0;
    const hoursByType: Partial<Record<ShiftType, number>> = {};
    const earningsByType: Partial<Record<ShiftType, number>> = {};

    monthReports.forEach(report => {
      const hours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
      const rate = settings.work.hourlyRates.find(hr => hr.type === report.shiftType)?.rate || 0;
      const earnings = hours * rate;

      totalHours += hours;
      totalEarnings += earnings;

      hoursByType[report.shiftType] = (hoursByType[report.shiftType] || 0) + hours;
      earningsByType[report.shiftType] = (earningsByType[report.shiftType] || 0) + earnings;
    });

    const sortedMonthReports = [...monthReports].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });

    const tableRows = sortedMonthReports.map(report => {
      const hours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
      return `
        <tr>
          <td>${formatDate(report.date)}</td>
          <td>${report.shiftType}</td>
          <td>${report.ship}</td>
          <td>${report.location}</td>
          <td>${report.startTime}</td>
          <td>${report.endTime}</td>
          <td>${report.pauseMinutes} min</td>
          <td><strong>${hours.toFixed(2)}h</strong></td>
        </tr>
      `;
    }).join('');

    const categoryRows = Object.entries(hoursByType).map(([type, hours]) => {
      const earnings = earningsByType[type as ShiftType] || 0;
      const rate = settings.work.hourlyRates.find(hr => hr.type === type)?.rate || 0;
      return `
        <tr>
          <td>${type}</td>
          <td>${hours.toFixed(2)}h</td>
          <td>€${rate.toFixed(2)}/h</td>
          <td><strong>€${earnings.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Report Mensile</title>
          <style>
            @page { size: A4 portrait; margin: 1cm; }
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 21cm; margin: 0 auto; }
            .header { margin-bottom: 32px; border-bottom: 2px solid #2563eb; padding-bottom: 16px; }
            .title { font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px; text-align: center; }
            .subtitle { font-size: 18px; font-weight: 600; color: #374151; text-align: center; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
            th { background-color: #2563eb; color: white; padding: 10px 8px; text-align: center; font-size: 11px; font-weight: bold; }
            td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 10px; color: #111827; text-align: center; }
            .summary-box { background-color: #f0f9ff; border: 2px solid #2563eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
            .summary-item { background-color: white; padding: 12px; border-radius: 8px; }
            .summary-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
            .summary-value { font-size: 20px; font-weight: bold; color: #111827; }
            .highlight { background-color: #2563eb; color: white; padding: 16px; border-radius: 8px; text-align: center; }
            .highlight-label { font-size: 14px; margin-bottom: 4px; }
            .highlight-value { font-size: 28px; font-weight: bold; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
            .footer-text { font-size: 11px; color: #9ca3af; text-align: center; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Report Mensile di ${settings.user.name || '[Nome Utente]'}</div>
            <div class="subtitle">della ditta ${settings.user.company || '[Nome Ditta]'}</div>
          </div>

          <div class="section">
            <div class="section-title">Resoconto Ore Lavorate e Guadagni</div>
            <div class="summary-box">
              <div class="summary-grid">
                <div class="highlight">
                  <div class="highlight-label">Totale Ore</div>
                  <div class="highlight-value">${totalHours.toFixed(2)}h</div>
                </div>
                <div class="highlight">
                  <div class="highlight-label">Totale Guadagni</div>
                  <div class="highlight-value">€${totalEarnings.toFixed(2)}</div>
                </div>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Ore Totali</th>
                    <th>Tariffa Oraria</th>
                    <th>Guadagno</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoryRows}
                </tbody>
              </table>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tabella Dati Utente</div>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Giornata</th>
                  <th>Nave</th>
                  <th>Luogo</th>
                  <th>Inizio</th>
                  <th>Fine</th>
                  <th>Pausa</th>
                  <th>Ore</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div class="footer-text">Report generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</div>
          </div>
        </body>
      </html>
    `;
  };

  const generateDailyReportExcelHTML = (data: ReturnType<typeof generateDailyReportExcelData>) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Report Giornaliero Excel</title>
          <style>
            @page { size: A4 portrait; margin: 0.8cm; }
            body { font-family: Arial, sans-serif; padding: 10px; background-color: #ffffff; max-width: 21cm; margin: 0 auto; }
            .header { margin-bottom: 10px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; }
            .title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 3px; text-align: center; }
            .subtitle { font-size: 13px; font-weight: 600; color: #374151; text-align: center; }
            .info-section { margin-bottom: 10px; background-color: #f9fafb; padding: 8px; border-radius: 4px; }
            .info-row { display: flex; margin-bottom: 4px; }
            .info-label { font-size: 10px; font-weight: 600; color: #6b7280; width: 100px; }
            .info-value { font-size: 10px; color: #111827; }
            .section { margin-bottom: 10px; }
            .section-title { font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin-bottom: 8px; }
            th { background-color: #2563eb; color: white; padding: 5px 4px; text-align: center; font-size: 9px; font-weight: bold; }
            td { padding: 5px 4px; border: 1px solid #e5e7eb; font-size: 9px; color: #111827; text-align: center; }
            .user-row { background-color: #eff6ff; }
            .technician-col { text-align: left; }
            .text-box { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px; min-height: 40px; font-size: 9px; color: #374151; border-radius: 4px; }
            .summary-table { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px; border-radius: 4px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb; }
            .summary-label { font-size: 10px; color: #6b7280; font-weight: 500; }
            .summary-value { font-size: 10px; color: #111827; font-weight: 600; }
            .total-row { border-bottom: none; border-top: 2px solid #2563eb; margin-top: 4px; padding-top: 6px; }
            .total-label { font-size: 11px; color: #111827; font-weight: bold; }
            .total-value { font-size: 11px; color: #2563eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${data.title}</div>
            <div class="subtitle">${data.subtitle}</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <div class="info-label">Data del Report:</div>
              <div class="info-value">${data.info.date}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Nome della Nave:</div>
              <div class="info-value">${data.info.ship}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Luogo:</div>
              <div class="info-value">${data.info.location}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tecnici</div>
            <table>
              <thead>
                <tr>
                  <th class="technician-col">Tecnico</th>
                  <th>Ora Inizio</th>
                  <th>Ora Fine</th>
                  <th>Pausa</th>
                  <th>Ore Lavorate</th>
                </tr>
              </thead>
              <tbody>
                ${data.technicians.map(tech => `
                  <tr${tech.isUser ? ' class="user-row"' : ''}>
                    <td class="technician-col">${tech.name}</td>
                    <td>${tech.startTime}</td>
                    <td>${tech.endTime}</td>
                    <td>${tech.pause} min</td>
                    <td><strong>${tech.hours.toFixed(2)}h</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Materiali Utilizzati</div>
            <div class="text-box">${data.materials}</div>
          </div>

          <div class="section">
            <div class="section-title">Lavori Eseguiti</div>
            <div class="text-box">${data.workDone}</div>
          </div>

          <div class="section">
            <div class="section-title">Riepilogo Ore</div>
            <div class="summary-table">
              <div class="summary-row">
                <div class="summary-label">Totale Ore Utente:</div>
                <div class="summary-value">${data.summary.userHours.toFixed(2)}h</div>
              </div>
              <div class="summary-row">
                <div class="summary-label">Totale Ore Tecnici:</div>
                <div class="summary-value">${data.summary.techniciansHours.toFixed(2)}h</div>
              </div>
              <div class="summary-row total-row">
                <div class="total-label">Totale Ore Report:</div>
                <div class="total-value">${data.summary.totalHours.toFixed(2)}h</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generateDailyReportExcelData = (report: ReportType) => {
    const userHours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
    
    const techniciansData = report.technicians
      .map(tech => ({
        name: tech.name,
        startTime: tech.startTime,
        endTime: tech.endTime,
        pause: report.pauseMinutes,
        hours: calculateHours(tech.startTime, tech.endTime, report.pauseMinutes),
      }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const totalTechniciansHours = techniciansData.reduce((sum, tech) => sum + tech.hours, 0);
    const totalReportHours = userHours + totalTechniciansHours;

    return {
      title: `Report Giornaliero di ${settings.user.name || '[Nome Utente]'}`,
      subtitle: `della ditta ${settings.user.company || '[Nome Ditta]'}`,
      info: {
        date: formatDate(report.date),
        ship: report.ship,
        location: report.location,
      },
      technicians: [
        {
          name: settings.user.name || '[Utente]',
          startTime: report.startTime,
          endTime: report.endTime,
          pause: report.pauseMinutes,
          hours: userHours,
          isUser: true,
        },
        ...techniciansData.map(t => ({ ...t, isUser: false })),
      ],
      materials: report.materials || 'Nessun materiale specificato',
      workDone: report.workDone || 'Nessun lavoro specificato',
      summary: {
        userHours,
        techniciansHours: totalTechniciansHours,
        totalHours: totalReportHours,
      },
    };
  };

  const generateMonthlyReportExcelData = () => {
    const monthReports = reports.filter(r => r.date.startsWith(selectedMonth));
    
    let totalHours = 0;
    let totalEarnings = 0;
    const hoursByType: Partial<Record<ShiftType, number>> = {};
    const earningsByType: Partial<Record<ShiftType, number>> = {};

    monthReports.forEach(report => {
      const hours = calculateHours(report.startTime, report.endTime, report.pauseMinutes);
      const rate = settings.work.hourlyRates.find(hr => hr.type === report.shiftType)?.rate || 0;
      const earnings = hours * rate;

      totalHours += hours;
      totalEarnings += earnings;

      hoursByType[report.shiftType] = (hoursByType[report.shiftType] || 0) + hours;
      earningsByType[report.shiftType] = (earningsByType[report.shiftType] || 0) + earnings;
    });

    return {
      title: `Report Mensile di ${settings.user.name || '[Nome Utente]'}`,
      subtitle: `della ditta ${settings.user.company || '[Nome Ditta]'}`,
      month: selectedMonth,
      summary: {
        totalHours,
        totalEarnings,
      },
      categories: Object.entries(hoursByType).map(([type, hours]) => ({
        type,
        hours,
        rate: settings.work.hourlyRates.find(hr => hr.type === type)?.rate || 0,
        earnings: earningsByType[type as ShiftType] || 0,
      })),
      reports: [...monthReports]
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        })
        .map(report => ({
          date: formatDate(report.date),
          category: report.shiftType,
          ship: report.ship,
          location: report.location,
          startTime: report.startTime,
          endTime: report.endTime,
          pause: report.pauseMinutes,
          hours: calculateHours(report.startTime, report.endTime, report.pauseMinutes),
        })),
    };
  };





  const handleShareDailyReportPDF = async () => {
    try {
      console.log('Condivisione report giornaliero PDF...');
      const reportData = reports.filter(r => r.date === selectedDate);
      
      if (reportData.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questa data');
        return;
      }

      const report = reportData[0];
      const html = generateDailyReportHTML(report);
      
      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html });
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_giornaliero_${selectedDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Successo', 'PDF scaricato con successo');
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Condividi PDF',
        });
      }
      console.log('PDF condiviso con successo');
    } catch (error) {
      console.error('Errore condivisione PDF:', error);
      Alert.alert('Errore', 'Impossibile condividere il PDF');
    }
  };

  const handleShareDailyReportExcel = async () => {
    try {
      console.log('Condivisione report giornaliero Excel...');
      const reportData = reports.filter(r => r.date === selectedDate);
      
      if (reportData.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questa data');
        return;
      }

      const report = reportData[0];
      const data = generateDailyReportExcelData(report);
      const html = generateDailyReportExcelHTML(data);
      
      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html });
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_giornaliero_excel_${selectedDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Successo', 'Excel scaricato con successo');
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Condividi Excel',
        });
      }
      console.log('Excel condiviso con successo');
    } catch (error) {
      console.error('Errore condivisione Excel:', error);
      Alert.alert('Errore', 'Impossibile condividere Excel');
    }
  };

  const handleViewMonthlyReportPDF = async () => {
    try {
      console.log('Apertura report mensile PDF...');
      const monthReports = reports.filter(r => r.date.startsWith(selectedMonth));
      
      if (monthReports.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questo mese');
        return;
      }

      const html = generateMonthlyReportHTML();
      const title = `Report Mensile - ${selectedMonth}`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        router.push({
          pathname: '/view-pdf',
          params: {
            html: encodeURIComponent(html),
            title: encodeURIComponent(title),
          },
        });
      }
    } catch (error) {
      console.error('Errore apertura report mensile PDF:', error);
      Alert.alert('Errore', 'Impossibile aprire il report mensile PDF');
    }
  };

  const handleShareMonthlyReportPDF = async () => {
    try {
      console.log('Condivisione report mensile PDF...');
      const monthReports = reports.filter(r => r.date.startsWith(selectedMonth));
      
      if (monthReports.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questo mese');
        return;
      }

      const html = generateMonthlyReportHTML();
      
      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html });
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_mensile_${selectedMonth}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Successo', 'PDF scaricato con successo');
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Condividi PDF',
        });
      }
      console.log('PDF condiviso con successo');
    } catch (error) {
      console.error('Errore condivisione PDF:', error);
      Alert.alert('Errore', 'Impossibile condividere il PDF');
    }
  };



  const generateMonthlyReportExcelHTML = (data: ReturnType<typeof generateMonthlyReportExcelData>) => {
    const categoryRows = data.categories.map(cat => `
      <tr>
        <td>${cat.type}</td>
        <td>${cat.hours.toFixed(2)}h</td>
        <td>€${cat.rate.toFixed(2)}/h</td>
        <td><strong>€${cat.earnings.toFixed(2)}</strong></td>
      </tr>
    `).join('');

    const reportRows = data.reports.map(rep => `
      <tr>
        <td>${rep.date}</td>
        <td>${rep.category}</td>
        <td>${rep.ship}</td>
        <td>${rep.location}</td>
        <td>${rep.startTime}</td>
        <td>${rep.endTime}</td>
        <td>${rep.pause} min</td>
        <td><strong>${rep.hours.toFixed(2)}h</strong></td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Report Mensile Excel</title>
          <style>
            @page { size: A4 portrait; margin: 0.8cm; }
            @media print {
              body { margin: 0; padding: 10px; }
              .section { page-break-inside: avoid; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 10px; 
              background-color: #ffffff;
              max-width: 21cm;
              margin: 0 auto;
              overflow-x: hidden;
            }
            .header { 
              margin-bottom: 10px; 
              border-bottom: 2px solid #2563eb; 
              padding-bottom: 6px; 
            }
            .title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #111827; 
              margin-bottom: 3px; 
              text-align: center; 
            }
            .subtitle { 
              font-size: 13px; 
              font-weight: 600; 
              color: #374151; 
              text-align: center; 
            }
            .section { 
              margin-bottom: 10px; 
            }
            .section-title { 
              font-size: 12px; 
              font-weight: bold; 
              color: #111827; 
              margin-bottom: 6px; 
              border-bottom: 1px solid #e5e7eb; 
              padding-bottom: 2px; 
            }
            .summary-box { 
              background-color: #f0fdf4; 
              border: 2px solid #10b981; 
              border-radius: 6px; 
              padding: 8px; 
              margin-bottom: 10px; 
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 8px; 
              margin-bottom: 8px; 
            }
            .summary-item { 
              background-color: white; 
              padding: 6px; 
              border-radius: 4px; 
              text-align: center; 
            }
            .summary-label { 
              font-size: 9px; 
              color: #6b7280; 
              margin-bottom: 3px; 
            }
            .summary-value { 
              font-size: 14px; 
              font-weight: bold; 
              color: #10b981; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              border: 1px solid #d1d5db; 
              margin-bottom: 8px;
              table-layout: fixed;
            }
            th { 
              background-color: #10b981; 
              color: white; 
              padding: 2px 1px; 
              text-align: center; 
              font-size: 6px; 
              font-weight: bold; 
              line-height: 1.1;
            }
            td { 
              padding: 2px 1px; 
              border: 1px solid #e5e7eb; 
              font-size: 5.5px; 
              color: #111827; 
              text-align: center;
              line-height: 1.1;
              word-wrap: break-word;
              overflow: hidden;
            }
            .category-table td { font-size: 9px; padding: 5px 3px; }
            .category-table th { font-size: 9px; padding: 5px 3px; background-color: #10b981; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${data.title}</div>
            <div class="subtitle">${data.subtitle}</div>
          </div>

          <div class="section">
            <div class="section-title">Resoconto Ore Lavorate e Guadagni</div>
            <div class="summary-box">
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-label">Totale Ore</div>
                  <div class="summary-value">${data.summary.totalHours.toFixed(2)}h</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">Totale Guadagni</div>
                  <div class="summary-value">€${data.summary.totalEarnings.toFixed(2)}</div>
                </div>
              </div>
              
              <table class="category-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Ore Totali</th>
                    <th>Tariffa Oraria</th>
                    <th>Guadagno</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoryRows}
                </tbody>
              </table>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Tabella Dati Utente</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 11%;">Data</th>
                  <th style="width: 18%;">Giornata</th>
                  <th style="width: 14%;">Nave</th>
                  <th style="width: 14%;">Luogo</th>
                  <th style="width: 9%;">Inizio</th>
                  <th style="width: 9%;">Fine</th>
                  <th style="width: 9%;">Pausa</th>
                  <th style="width: 9%;">Ore</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
  };

  const handleViewMonthlyReportExcel = () => {
    try {
      console.log('Apertura report mensile Excel...');
      const monthReports = reports.filter(r => r.date.startsWith(selectedMonth));
      
      if (monthReports.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questo mese');
        return;
      }

      const data = generateMonthlyReportExcelData();
      const title = `Report Mensile - ${selectedMonth}`;

      if (Platform.OS === 'web') {
        const blob = new Blob([generateMonthlyReportExcelHTML(data)], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        router.push({
          pathname: '/view-excel',
          params: {
            data: encodeURIComponent(JSON.stringify(data)),
            title: encodeURIComponent(title),
          },
        });
      }
    } catch (error) {
      console.error('Errore apertura report mensile Excel:', error);
      Alert.alert('Errore', 'Impossibile aprire il report mensile Excel');
    }
  };

  const handleShareMonthlyReportExcel = async () => {
    try {
      console.log('Condivisione report mensile Excel...');
      const monthReports = reports.filter(r => r.date.startsWith(selectedMonth));
      
      if (monthReports.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questo mese');
        return;
      }

      const data = generateMonthlyReportExcelData();
      const html = generateMonthlyReportExcelHTML(data);
      
      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html });
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_mensile_excel_${selectedMonth}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Successo', 'Excel scaricato con successo');
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Condividi Excel',
        });
      }
      console.log('Excel condiviso con successo');
    } catch (error) {
      console.error('Errore condivisione Excel:', error);
      Alert.alert('Errore', 'Impossibile condividere Excel');
    }
  };

  const handleViewDailyReportPDF = async () => {
    try {
      console.log('Apertura report giornaliero PDF...');
      const reportData = reports.filter(r => r.date === selectedDate);
      
      if (reportData.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questa data');
        return;
      }

      const report = reportData[0];
      const html = generateDailyReportHTML(report);
      const title = `Report Giornaliero - ${formatDate(selectedDate)}`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        router.push({
          pathname: '/view-pdf',
          params: {
            html: encodeURIComponent(html),
            title: encodeURIComponent(title),
          },
        });
      }
    } catch (error) {
      console.error('Errore apertura report giornaliero PDF:', error);
      Alert.alert('Errore', 'Impossibile aprire il report giornaliero PDF');
    }
  };



  const handleViewDailyReportExcel = () => {
    try {
      console.log('Apertura report giornaliero Excel...');
      const reportData = reports.filter(r => r.date === selectedDate);
      
      if (reportData.length === 0) {
        Alert.alert('Attenzione', 'Nessun report trovato per questa data');
        return;
      }

      const report = reportData[0];
      const data = generateDailyReportExcelData(report);
      const title = `Report Giornaliero - ${formatDate(selectedDate)}`;

      if (Platform.OS === 'web') {
        const blob = new Blob([generateDailyReportExcelHTML(data)], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        router.push({
          pathname: '/view-excel',
          params: {
            data: encodeURIComponent(JSON.stringify(data)),
            title: encodeURIComponent(title),
          },
        });
      }
    } catch (error) {
      console.error('Errore apertura report giornaliero Excel:', error);
      Alert.alert('Errore', 'Impossibile aprire il report giornaliero Excel');
    }
  };









  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Report',
        headerStyle: { backgroundColor: '#2563eb' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' as const },
      }} />
      <View style={styles.wrapper}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.section, { zIndex: reportTypeZIndex }]}>
        <Text style={styles.sectionTitle}>Tipo di Report</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => {
            setShowReportTypePicker(!showReportTypePicker);
            setReportTypeZIndex(showReportTypePicker ? 1 : 1000);
            setMonthZIndex(1);
          }}
        >
          <Text style={styles.pickerText}>
            {reportType === 'daily' ? 'Giornaliero' : 'Mensile'}
          </Text>
          <ChevronDown size={20} color="#6b7280" />
        </TouchableOpacity>
        {showReportTypePicker && (
          <View style={styles.pickerOptions}>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setReportType('daily');
                setShowReportTypePicker(false);
                setReportTypeZIndex(1);
              }}
            >
              <Text style={styles.pickerOptionText}>Giornaliero</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickerOption}
              onPress={() => {
                setReportType('monthly');
                setShowReportTypePicker(false);
                setReportTypeZIndex(1);
              }}
            >
              <Text style={styles.pickerOptionText}>Mensile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {reportType === 'daily' ? (
        <View style={styles.section}>
          <DatePicker value={selectedDate} onChange={setSelectedDate} label="Data" />
        </View>
      ) : (
        <View style={[styles.section, { zIndex: monthZIndex }]}>
          <Text style={styles.sectionTitle}>Mese</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => {
              setShowMonthPicker(!showMonthPicker);
              setMonthZIndex(showMonthPicker ? 1 : 1000);
              setReportTypeZIndex(1);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Calendar size={20} color="#6b7280" style={{ marginRight: 12 }} />
              <Text style={styles.pickerText}>
                {(() => {
                  const [year, month] = selectedMonth.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                  return date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
                })()}
              </Text>
            </View>
            <ChevronDown size={20} color="#6b7280" />
          </TouchableOpacity>
          {showMonthPicker && (
            <View style={styles.pickerOptions}>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthLabel = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
                return (
                  <TouchableOpacity
                    key={monthValue}
                    style={styles.pickerOption}
                    onPress={() => {
                      setSelectedMonth(monthValue);
                      setShowMonthPicker(false);
                      setMonthZIndex(1);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{monthLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {reportType === 'daily' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Giornaliero</Text>
          <View style={styles.buttonColumnsRow}>
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                testID="btn-view-daily-pdf"
                style={[styles.exportButton, styles.pdfButton]}
                onPress={handleViewDailyReportPDF}
              >
                <Eye size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Visualizza PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-share-daily-pdf"
                style={[styles.exportButton, styles.pdfButton]}
                onPress={handleShareDailyReportPDF}
              >
                <Share2 size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Condividi PDF</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                testID="btn-view-daily-excel"
                style={[styles.exportButton, styles.excelButton]}
                onPress={handleViewDailyReportExcel}
              >
                <Eye size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Visualizza Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-share-daily-excel"
                style={[styles.exportButton, styles.excelButton]}
                onPress={handleShareDailyReportExcel}
              >
                <Share2 size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Condividi Excel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Mensile</Text>
          <View style={styles.buttonColumnsRow}>
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                testID="btn-view-monthly-pdf"
                style={[styles.exportButton, styles.pdfButton]}
                onPress={handleViewMonthlyReportPDF}
              >
                <Eye size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Visualizza PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-share-monthly-pdf"
                style={[styles.exportButton, styles.pdfButton]}
                onPress={handleShareMonthlyReportPDF}
              >
                <Share2 size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Condividi PDF</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonColumn}>
              <TouchableOpacity
                testID="btn-view-monthly-excel"
                style={[styles.exportButton, styles.excelButton]}
                onPress={handleViewMonthlyReportExcel}
              >
                <Eye size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Visualizza Excel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="btn-share-monthly-excel"
                style={[styles.exportButton, styles.excelButton]}
                onPress={handleShareMonthlyReportExcel}
              >
                <Share2 size={20} color="#ffffff" />
                <Text style={styles.exportButtonText}>Condividi Excel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {reportType === 'monthly' && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Dati Mensili</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Totale Report</Text>
              <Text style={styles.statValue}>{monthlyStats.reportCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Totale Ore</Text>
              <Text style={styles.statValue}>{monthlyStats.totalHours.toFixed(1)}h</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Guadagno Totale</Text>
              <Text style={styles.statValueHighlight}>€{monthlyStats.totalEarnings.toFixed(2)}</Text>
            </View>
          </View>

          {Object.keys(monthlyStats.hoursByType).length > 0 && (
            <View style={styles.breakdown}>
              <Text style={styles.breakdownTitle}>Dettaglio per Categoria</Text>
              {Object.entries(monthlyStats.hoursByType).map(([type, hours]) => (
                <View key={type} style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{type}</Text>
                  <View style={styles.breakdownValues}>
                    <Text style={styles.breakdownHours}>{hours.toFixed(1)}h</Text>
                    <Text style={styles.breakdownEarnings}>
                      €{(monthlyStats.earningsByType[type as ShiftType] || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}


        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
    position: 'relative' as const,
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 12,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    height: 48,
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerOptions: {
    position: 'absolute' as const,
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
    overflow: 'hidden',
    zIndex: 1000,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    height: 48,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    fontSize: 16,
    color: '#111827',
  },
  buttonColumnsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonColumn: {
    flex: 1,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  halfButton: {
    flex: 1,
  },
  pdfButton: {
    backgroundColor: '#2563eb',
  },
  excelButton: {
    backgroundColor: '#10b981',
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
  },
  statValueHighlight: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#2563eb',
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  breakdownValues: {
    flexDirection: 'row',
    gap: 16,
  },
  breakdownHours: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    minWidth: 60,
    textAlign: 'right',
  },
  breakdownEarnings: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2563eb',
    minWidth: 80,
    textAlign: 'right',
  },

});
