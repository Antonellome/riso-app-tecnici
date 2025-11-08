import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface ExcelData {
  [key: string]: string | number;
}

interface MonthlyReportData {
  title: string;
  subtitle: string;
  month: string;
  summary: {
    totalHours: number;
    totalEarnings: number;
  };
  categories: Array<{
    type: string;
    hours: number;
    rate: number;
    earnings: number;
  }>;
  reports: Array<{
    date: string;
    category: string;
    ship: string;
    location: string;
    startTime: string;
    endTime: string;
    pause: number;
    hours: number;
  }>;
}

interface DailyReportData {
  title: string;
  subtitle: string;
  info: {
    date: string;
    ship: string;
    location: string;
  };
  technicians: Array<{
    name: string;
    startTime: string;
    endTime: string;
    pause: number;
    hours: number;
    isUser: boolean;
  }>;
  materials: string;
  workDone: string;
  summary: {
    userHours: number;
    techniciansHours: number;
    totalHours: number;
  };
}

export default function ViewExcelScreen() {
  const params = useLocalSearchParams<{ data: string; title: string }>();

  const parsedData = useMemo(() => {
    try {
      if (!params.data) return null;
      
      console.log('[ViewExcel] Raw params.data type:', typeof params.data);
      console.log('[ViewExcel] Raw params.data preview:', typeof params.data === 'string' ? params.data.substring(0, 100) : 'not a string');
      
      if (typeof params.data === 'object' && params.data !== null) {
        console.log('[ViewExcel] Data is already an object, returning directly');
        return params.data;
      }
      
      let decodedData = params.data;
      try {
        decodedData = decodeURIComponent(params.data);
        console.log('[ViewExcel] Decoded data preview:', decodedData.substring(0, 100));
      } catch (decodeError) {
        console.warn('[ViewExcel] Impossibile decodificare URI, uso dati diretti');
      }
      
      const data = JSON.parse(decodedData);
      console.log('[ViewExcel] Successfully parsed data');
      return data;
    } catch (err) {
      console.error('[ViewExcel] Errore caricamento dati:', err);
      console.error('[ViewExcel] Error details:', err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [params.data]);

  const isDailyReport = useMemo(() => {
    return parsedData && 'technicians' in parsedData && 'summary' in parsedData && !('categories' in parsedData);
  }, [parsedData]);

  const isMonthlyReport = useMemo(() => {
    return parsedData && 'categories' in parsedData && 'reports' in parsedData && Array.isArray((parsedData as any).reports);
  }, [parsedData]);

  const excelData = useMemo<ExcelData[]>(() => {
    if (!parsedData || isDailyReport || isMonthlyReport) return [];
    return Array.isArray(parsedData) ? parsedData : [];
  }, [parsedData, isDailyReport, isMonthlyReport]);

  const dailyReportData = useMemo<DailyReportData | null>(() => {
    if (!parsedData || !isDailyReport) return null;
    return parsedData as DailyReportData;
  }, [parsedData, isDailyReport]);

  const monthlyReportData = useMemo<MonthlyReportData | null>(() => {
    if (!parsedData || !isMonthlyReport) return null;
    return parsedData as MonthlyReportData;
  }, [parsedData, isMonthlyReport]);

  const handleShare = async () => {
    if (!parsedData) return;
    try {
      let html = '';
      if (isDailyReport && dailyReportData) {
        html = generateDailyReportHTML(dailyReportData);
      } else if (isMonthlyReport && monthlyReportData) {
        html = generateMonthlyReportHTML(monthlyReportData);
      } else {
        Alert.alert('Errore', 'Formato non supportato');
        return;
      }

      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html });
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'report_excel.pdf';
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
    } catch (error) {
      console.error('Errore condivisione Excel:', error);
      Alert.alert('Errore', 'Impossibile condividere Excel');
    }
  };

  const generateDailyReportHTML = (data: DailyReportData) => {
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
            .header { margin-bottom: 10px; border-bottom: 2px solid #10b981; padding-bottom: 6px; }
            .title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 3px; text-align: center; }
            .subtitle { font-size: 13px; font-weight: 600; color: #374151; text-align: center; }
            .info-section { margin-bottom: 10px; background-color: #f9fafb; padding: 8px; border-radius: 4px; }
            .info-row { display: flex; margin-bottom: 4px; }
            .info-label { font-size: 10px; font-weight: 600; color: #6b7280; width: 100px; }
            .info-value { font-size: 10px; color: #111827; }
            .section { margin-bottom: 10px; }
            .section-title { font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin-bottom: 8px; }
            th { background-color: #10b981; color: white; padding: 5px 4px; text-align: center; font-size: 9px; font-weight: bold; }
            td { padding: 5px 4px; border: 1px solid #e5e7eb; font-size: 9px; color: #111827; text-align: center; }
            .user-row { background-color: #eff6ff; }
            .technician-col { text-align: left; }
            .text-box { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px; min-height: 40px; font-size: 9px; color: #374151; }
            .summary-table { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb; }
            .summary-label { font-size: 10px; color: #6b7280; font-weight: 500; }
            .summary-value { font-size: 10px; color: #111827; font-weight: 600; }
            .total-row { border-bottom: none; border-top: 2px solid #10b981; margin-top: 4px; padding-top: 6px; }
            .total-label { font-size: 11px; color: #111827; font-weight: bold; }
            .total-value { font-size: 11px; color: #10b981; font-weight: bold; }
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

  const generateMonthlyReportHTML = (data: MonthlyReportData) => {
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
              border-bottom: 2px solid #10b981; 
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

  const renderDailyReport = () => {
    if (!dailyReportData) return null;

    const data = dailyReportData;

    if (Platform.OS === 'web') {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Report Giornaliero Excel</title>
            <style>
              @page { size: A4 portrait; margin: 0.8cm; }
              body { font-family: Arial, sans-serif; padding: 10px; background-color: #ffffff; max-width: 21cm; margin: 0 auto; }
              .header { margin-bottom: 10px; border-bottom: 2px solid #10b981; padding-bottom: 6px; }
              .title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 3px; text-align: center; }
              .subtitle { font-size: 13px; font-weight: 600; color: #374151; text-align: center; }
              .info-section { margin-bottom: 10px; background-color: #f9fafb; padding: 8px; border-radius: 4px; }
              .info-row { display: flex; margin-bottom: 4px; }
              .info-label { font-size: 10px; font-weight: 600; color: #6b7280; width: 100px; }
              .info-value { font-size: 10px; color: #111827; }
              .section { margin-bottom: 10px; }
              .section-title { font-size: 12px; font-weight: bold; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; }
              table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin-bottom: 8px; }
              th { background-color: #10b981; color: white; padding: 5px 4px; text-align: center; font-size: 9px; font-weight: bold; }
              td { padding: 5px 4px; border: 1px solid #e5e7eb; font-size: 9px; color: #111827; text-align: center; }
              .user-row { background-color: #eff6ff; }
              .technician-col { text-align: left; }
              .text-box { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px; min-height: 40px; font-size: 9px; color: #374151; }
              .summary-table { background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px; }
              .summary-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5e7eb; }
              .summary-label { font-size: 10px; color: #6b7280; font-weight: 500; }
              .summary-value { font-size: 10px; color: #111827; font-weight: 600; }
              .total-row { border-bottom: none; border-top: 2px solid #10b981; margin-top: 4px; padding-top: 6px; }
              .total-label { font-size: 11px; color: #111827; font-weight: bold; }
              .total-value { font-size: 11px; color: #10b981; font-weight: bold; }
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

      return (
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Excel Viewer"
        />
      );
    }

    return (
      <ScrollView style={styles.mobileContainer}>
        <View style={styles.reportContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>{data.subtitle}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Data del Report:</Text>
              <Text style={styles.infoValue}>{data.info.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nome della Nave:</Text>
              <Text style={styles.infoValue}>{data.info.ship}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Luogo:</Text>
              <Text style={styles.infoValue}>{data.info.location}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tecnici</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.technicianCol]}>Tecnico</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCol]}>Inizio</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCol]}>Fine</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCol]}>Pausa</Text>
                <Text style={[styles.tableHeaderCell, styles.hoursCol]}>Ore</Text>
              </View>
              {data.technicians.map((tech, idx) => (
                <View key={idx} style={[styles.tableRow, tech.isUser && styles.userRow]}>
                  <Text style={[styles.tableCell, styles.technicianCol]}>{tech.name}</Text>
                  <Text style={[styles.tableCell, styles.timeCol]}>{tech.startTime}</Text>
                  <Text style={[styles.tableCell, styles.timeCol]}>{tech.endTime}</Text>
                  <Text style={[styles.tableCell, styles.timeCol]}>{tech.pause} min</Text>
                  <Text style={[styles.tableCell, styles.hoursCol, styles.boldText]}>
                    {tech.hours.toFixed(2)}h
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Materiali Utilizzati</Text>
            <View style={styles.textBox}>
              <Text style={styles.textContent}>{data.materials}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lavori Eseguiti</Text>
            <View style={styles.textBox}>
              <Text style={styles.textContent}>{data.workDone}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Riepilogo Ore</Text>
            <View style={styles.summaryTable}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Totale Ore Utente:</Text>
                <Text style={styles.summaryValue}>{data.summary.userHours.toFixed(2)}h</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Totale Ore Tecnici:</Text>
                <Text style={styles.summaryValue}>{data.summary.techniciansHours.toFixed(2)}h</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Totale Ore Report:</Text>
                <Text style={styles.totalValue}>{data.summary.totalHours.toFixed(2)}h</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderMonthlyReport = () => {
    if (!monthlyReportData) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Nessun dato da visualizzare</Text>
        </View>
      );
    }

    const data = monthlyReportData;

    if (Platform.OS === 'web') {
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

      const html = `
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
                border-bottom: 2px solid #10b981; 
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

      return (
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="Excel Viewer"
        />
      );
    }

    return (
      <ScrollView style={styles.mobileContainer}>
        <View style={styles.reportContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.subtitle}>{data.subtitle}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resoconto Ore Lavorate e Guadagni</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Totale Ore</Text>
                  <Text style={styles.summaryValueGreen}>{data.summary.totalHours.toFixed(2)}h</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Totale Guadagni</Text>
                  <Text style={styles.summaryValueGreen}>€{data.summary.totalEarnings.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Categoria</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Ore</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tariffa</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Guadagno</Text>
                </View>
                {data.categories.map((cat, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{cat.type}</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>{cat.hours.toFixed(2)}h</Text>
                    <Text style={[styles.tableCell, { flex: 1 }]}>€{cat.rate.toFixed(2)}/h</Text>
                    <Text style={[styles.tableCell, { flex: 1, fontWeight: '700' as const }]}>€{cat.earnings.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tabella Dati Utente</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 90 }]}>Data</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Giornata</Text>
                  <Text style={[styles.tableHeaderCell, { width: 70 }]}>Nave</Text>
                  <Text style={[styles.tableHeaderCell, { width: 70 }]}>Luogo</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60 }]}>Inizio</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60 }]}>Fine</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60 }]}>Pausa</Text>
                  <Text style={[styles.tableHeaderCell, { width: 60 }]}>Ore</Text>
                </View>
                {data.reports.map((rep, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 90, fontSize: 11 }]}>{rep.date}</Text>
                    <Text style={[styles.tableCell, { width: 100, fontSize: 11 }]}>{rep.category}</Text>
                    <Text style={[styles.tableCell, { width: 70, fontSize: 11 }]}>{rep.ship}</Text>
                    <Text style={[styles.tableCell, { width: 70, fontSize: 11 }]}>{rep.location}</Text>
                    <Text style={[styles.tableCell, { width: 60, fontSize: 11 }]}>{rep.startTime}</Text>
                    <Text style={[styles.tableCell, { width: 60, fontSize: 11 }]}>{rep.endTime}</Text>
                    <Text style={[styles.tableCell, { width: 60, fontSize: 11 }]}>{rep.pause}</Text>
                    <Text style={[styles.tableCell, { width: 60, fontSize: 11, fontWeight: '700' as const }]}>{rep.hours.toFixed(2)}h</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (!parsedData) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Nessun dato da visualizzare</Text>
        </View>
      );
    }

    if (isDailyReport) {
      return renderDailyReport();
    }

    if (isMonthlyReport) {
      return renderMonthlyReport();
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Formato dati non riconosciuto</Text>
      </View>
    );
  };

  const getColumnStyle = (header: string) => {
    switch (header) {
      case 'Data':
        return { flex: 1.2 };
      case 'Tipo':
        return { flex: 1 };
      case 'Inizio':
      case 'Fine':
        return { flex: 0.8 };
      case 'Pausa (min)':
        return { flex: 0.9 };
      case 'Ore':
      case 'Tariffa':
        return { flex: 0.7 };
      case 'Guadagno':
        return { flex: 1 };
      default:
        return { flex: 1 };
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: (() => {
            try {
              if (!params.title) return 'Visualizza Excel';
              const decoded = decodeURIComponent(params.title);
              return decoded;
            } catch (error) {
              return typeof params.title === 'string' ? params.title : 'Visualizza Excel';
            }
          })(),
          headerStyle: { backgroundColor: '#10b981' },
          headerTintColor: '#ffffff',
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={{ marginRight: 16 }}>
              <Share2 size={24} color="#ffffff" />
            </TouchableOpacity>
          ),
        }}
      />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  mobileContainer: {
    flex: 1,
  },
  reportContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6b7280',
    width: 120,
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 3,
  },
  table: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
  },
  userRow: {
    backgroundColor: '#eff6ff',
  },
  tableCell: {
    fontSize: 11,
    color: '#111827',
    textAlign: 'center',
  },
  technicianCol: {
    flex: 2,
    textAlign: 'left',
  },
  timeCol: {
    flex: 1,
  },
  hoursCol: {
    flex: 1,
  },
  boldText: {
    fontWeight: '700' as const,
  },
  textBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 10,
    minHeight: 60,
    borderRadius: 4,
  },
  textContent: {
    fontSize: 12,
    color: '#374151',
  },
  summaryTable: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600' as const,
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#10b981',
    marginTop: 6,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700' as const,
  },
  totalValue: {
    fontSize: 15,
    color: '#10b981',
    fontWeight: '700' as const,
  },
  dataRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 40,
  },
  dataCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
  },
  dataText: {
    color: '#111827',
    fontSize: 12,
    flexWrap: 'wrap',
  },
  summaryBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  summaryValueGreen: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#10b981',
  },
});
