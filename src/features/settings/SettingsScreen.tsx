import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Clipboard, Alert, Switch, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { THEME } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shield, Key, Database, RefreshCcw, Save, Copy, FileText, CheckCircle2 } from 'lucide-react-native';

export const SettingsScreen: React.FC = () => {
  const {
    openaiApiKey,
    setOpenaiApiKey,
    caloriesGoal,
    proteinGoal,
    updateGoals,
    exportData,
    importData,
    resetApp,
  } = useAppStore();

  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey);
  const [calInput, setCalInput] = useState(String(caloriesGoal));
  const [protInput, setProtInput] = useState(String(proteinGoal));
  const [backupJsonStr, setBackupJsonStr] = useState('');
  const [importJsonStr, setImportJsonStr] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleSaveSettings = () => {
    const calNum = Number(calInput);
    const protNum = Number(protInput);

    if (isNaN(calNum) || calNum < 1000 || calNum > 10000) {
      Alert.alert('Invalid Goals', 'Please enter a valid Calorie Goal (1,000 - 10,000 kcal).');
      return;
    }

    if (isNaN(protNum) || protNum < 10 || protNum > 500) {
      Alert.alert('Invalid Goals', 'Please enter a valid Protein Goal (10g - 500g).');
      return;
    }

    // Save preferences
    updateGoals(calNum, protNum);
    setOpenaiApiKey(apiKeyInput.trim());

    Alert.alert('Success', 'Preferences saved successfully!');
  };

  const handleExport = () => {
    const dataStr = exportData();
    setBackupJsonStr(dataStr);
    Clipboard.setString(dataStr);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    Alert.alert('Export Success', 'Database backup exported and copied to clipboard.');
  };

  const handleImport = () => {
    if (!importJsonStr.trim()) {
      Alert.alert('Empty Data', 'Please paste a valid JSON backup string to restore.');
      return;
    }

    Alert.alert(
      'Confirm Import',
      'Importing this backup will overwrite your current logs. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Overwite & Import',
          onPress: () => {
            const success = importData(importJsonStr);
            if (success) {
              setImportJsonStr('');
              Alert.alert('Success', 'Database restored successfully!');
            } else {
              Alert.alert('Import Failed', 'Invalid backup format. Please verify the JSON string.');
            }
          }
        }
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      '☢️ Reset Everything',
      'This action is permanent and will delete ALL habits, meals, outreach pitches, and projects. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: () => {
            resetApp();
            setApiKeyInput('');
            setCalInput('2800');
            setProtInput('90');
            setBackupJsonStr('');
            setImportJsonStr('');
            Alert.alert('Reset Complete', 'Database has been wiped. Defaults restored.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Settings Section */}
      <Text style={styles.sectionTitle}>Daily Targets Config</Text>
      
      <Card style={styles.settingsCard}>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              label="Calories Target (kcal)"
              value={calInput}
              onChangeText={setCalInput}
              keyboardType="numeric"
              placeholder="e.g. 2800"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Protein Target (g)"
              value={protInput}
              onChangeText={setProtInput}
              keyboardType="numeric"
              placeholder="e.g. 90"
            />
          </View>
        </View>

        <Text style={styles.cardInfoText}>
          Changing these values updates today's circular indicators and habit scores dynamically.
        </Text>
      </Card>

      {/* OpenAI API Key */}
      <Text style={styles.sectionTitle}>AI Integration settings</Text>
      <Card style={styles.settingsCard}>
        <View style={styles.headerRow}>
          <Key size={14} color={THEME.colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.settingsSubHeader}>OpenAI API Secret Key</Text>
        </View>
        
        <Input
          value={apiKeyInput}
          onChangeText={setApiKeyInput}
          placeholder="sk-proj-..."
          secureTextEntry
        />

        <Text style={styles.cardInfoText}>
          Your key is saved locally in secure device storage and is never uploaded anywhere. It is used to query the gpt-4o-mini model for natural language meal analysis.
        </Text>
      </Card>

      <Button
        title="Save Settings & API Key"
        onPress={handleSaveSettings}
        variant="primary"
        style={styles.saveBtn}
      />

      {/* Database Backup Section */}
      <Text style={styles.sectionTitle}>Backup & Sync (Offline Backup)</Text>
      <Card style={styles.settingsCard}>
        <View style={styles.headerRow}>
          <Database size={14} color={THEME.colors.accentBlue} style={{ marginRight: 6 }} />
          <Text style={styles.settingsSubHeader}>Export Database</Text>
        </View>
        <Text style={styles.cardInfoText}>
          Generate a JSON snapshot of all your logged habits, meals, outreach pitches, and projects.
        </Text>
        
        <Button
          title={isCopied ? "Copied!" : "Export Database & Copy"}
          onPress={handleExport}
          variant="secondary"
          style={{ marginVertical: THEME.spacing.sm }}
        />

        {backupJsonStr !== '' && (
          <Input
            value={backupJsonStr}
            onChangeText={() => {}}
            multiline
            numberOfLines={4}
            inputStyle={styles.jsonTextArea}
          />
        )}

        <View style={styles.divider} />

        <View style={styles.headerRow}>
          <FileText size={14} color={THEME.colors.accentBlue} style={{ marginRight: 6 }} />
          <Text style={styles.settingsSubHeader}>Import Database Restore</Text>
        </View>
        <Text style={styles.cardInfoText}>
          Paste a previously exported JSON backup string below to restore your history.
        </Text>

        <Input
          value={importJsonStr}
          onChangeText={setImportJsonStr}
          placeholder="Paste JSON string here..."
          multiline
          numberOfLines={4}
          inputStyle={styles.jsonTextArea}
        />

        <Button
          title="Restore from JSON Backup"
          onPress={handleImport}
          variant="secondary"
          style={{ marginTop: THEME.spacing.sm }}
        />
      </Card>

      {/* Dangerous Wipe Data */}
      <Text style={[styles.sectionTitle, { color: THEME.colors.danger }]}>Danger Zone</Text>
      <Card style={[styles.settingsCard, { borderColor: THEME.colors.danger }]}>
        <View style={styles.headerRow}>
          <RefreshCcw size={14} color={THEME.colors.danger} style={{ marginRight: 6 }} />
          <Text style={[styles.settingsSubHeader, { color: THEME.colors.danger }]}>Wipe Local Database</Text>
        </View>
        <Text style={styles.cardInfoText}>
          Permanently delete all tracked logs. This action resets all metrics to zero and cannot be undone.
        </Text>

        <Button
          title="Delete All Local Data"
          onPress={handleReset}
          variant="danger"
          style={{ marginTop: THEME.spacing.md }}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xxl,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 0.3,
  },
  settingsCard: {
    padding: THEME.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  settingsSubHeader: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cardInfoText: {
    color: THEME.colors.textMuted,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
    fontWeight: '500',
  },
  saveBtn: {
    width: '100%',
    marginVertical: THEME.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.md,
  },
  jsonTextArea: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: THEME.colors.textMuted,
    backgroundColor: THEME.colors.surface,
  },
});
