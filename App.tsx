import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from './src/store/useAppStore';
import { THEME } from './src/constants/theme';

// Screens
import { DashboardScreen } from './src/features/dashboard/DashboardScreen';
import { NutritionScreen } from './src/features/nutrition/NutritionScreen';
import { OutreachScreen } from './src/features/outreach/OutreachScreen';
import { ProjectsScreen } from './src/features/projects/ProjectsScreen';
import { SettingsScreen } from './src/features/settings/SettingsScreen';

// Icons
import { Home, Apple, Send, Briefcase, Settings } from 'lucide-react-native';

type TabType = 'dashboard' | 'nutrition' | 'outreach' | 'projects' | 'settings';

export default function App() {
  const { initApp, isDbInitialized } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Initialize DB and state preferences on mount
  useEffect(() => {
    initApp();
  }, []);

  if (!isDbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing local-first database...</Text>
      </View>
    );
  }

  // Render active screen
  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'nutrition':
        return <NutritionScreen />;
      case 'outreach':
        return <OutreachScreen />;
      case 'projects':
        return <ProjectsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'DISCIPLINE OPERATING SYSTEM';
      case 'nutrition':
        return 'NUTRITION & SURPLUS';
      case 'outreach':
        return 'OUTREACH CRM';
      case 'projects':
        return 'PROJECT MANAGEMENT';
      case 'settings':
        return 'SETTINGS CONFIG';
      default:
        return 'DISCIPLINE TRACKER';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      
      {/* Ambient Background Glow Blobs */}
      <View style={styles.glowBlobPurple} pointerEvents="none" />
      <View style={styles.glowBlobGreen} pointerEvents="none" />
      
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        {activeTab !== 'settings' ? (
          <TouchableOpacity 
            onPress={() => setActiveTab('settings')}
            style={styles.headerSettingsBtn}
            activeOpacity={0.7}
          >
            <Settings size={18} color={THEME.colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => setActiveTab('dashboard')}
            style={styles.headerSettingsBtnActive}
            activeOpacity={0.7}
          >
            <Text style={styles.closeSettingsText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Screen Content */}
      <View style={styles.container}>
        {renderScreen()}
      </View>

      {/* Custom Floating Bottom Tab Bar (hidden when settings is open) */}
      {activeTab !== 'settings' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('dashboard')}
            activeOpacity={0.7}
          >
            <View style={styles.tabItemContent}>
              <Home
                size={20}
                color={activeTab === 'dashboard' ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'dashboard' && styles.tabLabelActive,
                ]}
              >
                Dashboard
              </Text>
              {activeTab === 'dashboard' && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('nutrition')}
            activeOpacity={0.7}
          >
            <View style={styles.tabItemContent}>
              <Apple
                size={20}
                color={activeTab === 'nutrition' ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'nutrition' && styles.tabLabelActive,
                ]}
              >
                Nutrition
              </Text>
              {activeTab === 'nutrition' && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('outreach')}
            activeOpacity={0.7}
          >
            <View style={styles.tabItemContent}>
              <Send
                size={20}
                color={activeTab === 'outreach' ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'outreach' && styles.tabLabelActive,
                ]}
              >
                Outreach
              </Text>
              {activeTab === 'outreach' && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('projects')}
            activeOpacity={0.7}
          >
            <View style={styles.tabItemContent}>
              <Briefcase
                size={20}
                color={activeTab === 'projects' ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'projects' && styles.tabLabelActive,
                ]}
              >
                Projects
              </Text>
              {activeTab === 'projects' && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    position: 'relative',
    overflow: 'hidden',
  },
  glowBlobPurple: {
    position: 'absolute',
    top: 100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#8b5cf6',
    opacity: 0.07,
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      }
    }),
  },
  glowBlobGreen: {
    position: 'absolute',
    bottom: 80,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#10b981',
    opacity: 0.06,
    ...Platform.select({
      web: {
        filter: 'blur(120px)',
      }
    }),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
  },
  headerTitle: {
    color: THEME.colors.text,
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-Bold' : 'sans-serif-condensed',
  },
  headerSettingsBtn: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.md,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSettingsBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.sm + 4,
    paddingVertical: THEME.spacing.xs + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSettingsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.75)', // Glassmorphism dark slate
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderRadius: 24,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemContent: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  tabLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10.5,
    marginTop: 4,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: THEME.colors.primary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
});
