import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Share2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ViewPDFScreen() {
  const params = useLocalSearchParams<{ html: string; title: string }>();

  const htmlContent = useMemo(() => {
    if (!params.html) return '';
    try {
      const decoded = decodeURIComponent(params.html);
      return decoded;
    } catch (error) {
      console.warn('Impossibile decodificare HTML, uso contenuto diretto');
      return typeof params.html === 'string' ? params.html : '';
    }
  }, [params.html]);

  const handleShare = async () => {
    if (!htmlContent) return;
    try {
      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const response = await fetch(uri);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'report.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Successo', 'PDF scaricato con successo');
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Condividi PDF',
        });
      }
    } catch (error) {
      console.error('Errore condivisione PDF:', error);
      Alert.alert('Errore', 'Impossibile condividere il PDF');
    }
  };

  const renderContent = () => {
    if (!htmlContent) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Nessun contenuto da visualizzare</Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <iframe
          srcDoc={htmlContent}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="PDF Viewer"
        />
      );
    }

    return (
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scalesPageToFit={false}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        contentMode="mobile"
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: (() => {
            try {
              if (!params.title) return 'Visualizza PDF';
              const decoded = decodeURIComponent(params.title);
              return decoded;
            } catch (error) {
              return typeof params.title === 'string' ? params.title : 'Visualizza PDF';
            }
          })(),
          headerStyle: { backgroundColor: '#2563eb' },
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
    backgroundColor: '#eff6ff',
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
  webview: {
    flex: 1,
  },
});
