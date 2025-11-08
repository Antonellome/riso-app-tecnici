import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, useWindowDimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const handleEnter = () => {
    console.log('[WelcomeScreen] Navigating to home');
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <Svg
        height={320}
        width={width}
        viewBox={`0 0 ${width} 320`}
        style={styles.curve}
      >
        <Path
          d={`M0,0 L${width},0 L${width},280 Q${width / 2},320 0,280 L0,0 Z`}
          fill="#4F7DFF"
        />
      </Svg>

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.centerContent}>
        <Text style={styles.appName}>R.I.S.O. APP TECNICI</Text>
        <Text style={styles.title}>Benvenuto</Text>
        <Text style={styles.subtitle}>Report Individuali Sincronizzati Online</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleEnter}
          activeOpacity={0.8}
        >
          <ArrowRight size={24} color="#ffffff" style={styles.icon} />
          <Text style={styles.buttonText}>Entra</Text>
        </TouchableOpacity>

        <Text style={styles.byAsText}>by AS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  curve: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
  },
  centerContent: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 24,
  },
  title: {
    fontSize: 56,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center' as const,
    lineHeight: 26,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4F7DFF',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#4F7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  byAsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic' as const,
    marginTop: 32,
  },
  logoContainer: {
    position: 'absolute' as const,
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
});
