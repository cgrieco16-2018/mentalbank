import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  Share,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile, Paths } from "expo-file-system";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { UserProfile, AppSettings } from "@/utils/types";

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme: colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showBackupDataModal, setShowBackupDataModal] = useState(false);
  const [backupJsonData, setBackupJsonData] = useState("");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [editName, setEditName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const DEFAULT_PROFILE: UserProfile = {
    displayName: "Mental Bank User",
    avatarUri: undefined,
  };

  const DEFAULT_SETTINGS: AppSettings = {
    defaultPayRate: 50,
    applePencilPressure: 0.8,
    exportFormat: "csv",
  };

  const loadData = async () => {
    try {
      const [profileData, settingsData] = await Promise.all([
        storage.getProfile(),
        storage.getSettings(),
      ]);

      setProfile(profileData || DEFAULT_PROFILE);
      setSettings(settingsData || DEFAULT_SETTINGS);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const handleExport = async () => {
    try {
      const format = settings?.exportFormat || "csv";
      const allEvents = await storage.getAllValueEvents();
      const fileName = `mental-bank-ledger-${new Date().toISOString().split("T")[0]}.csv`;
      
      if (format === "pdf") {
        Alert.alert(
          "PDF Export Coming Soon",
          "PDF export will be available in a future update. Currently exporting as CSV.",
        );
      }

      const csvData = [
        "Date,Description,Units,Unit Type,Pay Rate,Amount",
        ...allEvents.map(
          (e) =>
            `${e.date},"${e.description}",${e.units},${e.unitType},${e.payRate},${e.amount}`
        ),
      ].join("\n");

      if (Platform.OS === "web") {
        const blob = new Blob([csvData], { type: "text/csv" });
        const file = new File([blob], fileName, { type: "text/csv" });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: "Mental Bank Ledger Export",
            });
          } catch (err: any) {
            if (err.name !== "AbortError") {
              console.error("Share failed:", err);
            }
          }
        } else {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
          window.alert("Ledger Exported!\n\nYour file '" + fileName + "' has been downloaded.");
        }
      } else {
        const exportFile = new ExpoFile(Paths.cache, fileName);
        await exportFile.write(csvData);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(exportFile.uri, {
            mimeType: "text/csv",
            dialogTitle: "Save Ledger Export",
            UTI: "public.comma-separated-values-text",
          });
        } else {
          Alert.alert(
            "Export Created",
            "Your export was created but sharing is not available on this device."
          );
        }
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      Alert.alert("Error", "Failed to export data. Please try again.");
    }
  };

  const openProfileModal = () => {
    setEditName(profile?.displayName || "");
    setShowProfileModal(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    try {
      const updatedProfile: UserProfile = {
        displayName: editName.trim(),
        avatarUri: profile?.avatarUri,
      };
      await storage.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const selectExportFormat = async (format: "csv" | "pdf") => {
    try {
      const currentSettings = settings || DEFAULT_SETTINGS;
      const updatedSettings: AppSettings = {
        ...currentSettings,
        exportFormat: format,
      };
      await storage.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      setShowFormatModal(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleResetBalance = async () => {
    const performReset = async () => {
      try {
        await storage.clearAllData();
        await loadData();
        if (Platform.OS === "web") {
          window.alert("Success!\n\nLedger has been reset. All value events and reality incomes have been deleted.");
        } else {
          Alert.alert("Success", "Ledger has been reset. All value events and reality incomes have been deleted.");
        }
      } catch (error) {
        console.error("Failed to reset:", error);
        if (Platform.OS === "web") {
          window.alert("Error: Failed to reset ledger. Please try again.");
        } else {
          Alert.alert("Error", "Failed to reset ledger. Please try again.");
        }
      }
    };

    if (Platform.OS === "web") {
      const firstConfirm = window.confirm("Reset Ledger\n\nAre you sure you want to delete all value events and reality incomes? This action cannot be undone.");
      if (!firstConfirm) return;
      
      const secondConfirm = window.confirm("Confirm Reset\n\nThis will permanently delete all your data. Are you absolutely sure?");
      if (!secondConfirm) return;
      
      await performReset();
    } else {
      Alert.alert(
        "Reset Ledger",
        "Are you sure you want to delete all value events? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reset",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "Confirm Reset",
                "This will permanently delete all your value events. Are you absolutely sure?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete All",
                    style: "destructive",
                    onPress: performReset,
                  },
                ]
              );
            },
          },
        ]
      );
    }
  };

  const handleCopyBackupData = async () => {
    try {
      await Clipboard.setStringAsync(backupJsonData);
      if (Platform.OS === "web") {
        window.alert("Copied to clipboard! Paste this into a text file to save your backup.");
      } else {
        Alert.alert("Copied!", "Backup data copied to clipboard. Paste into Notes or a text file to save.");
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      if (Platform.OS === "web") {
        window.alert("Could not copy automatically. Please select all the text and copy manually.");
      } else {
        Alert.alert("Error", "Could not copy. Please select all text and copy manually.");
      }
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const jsonData = await storage.exportAllData();
      const fileName = `mental-bank-backup-${new Date().toISOString().split("T")[0]}.json`;

      if (Platform.OS === "web") {
        setBackupJsonData(jsonData);
        setShowBackupDataModal(true);
      } else {
        try {
          const backupFile = new ExpoFile(Paths.document, fileName);
          await backupFile.write(jsonData);
          
          const canShare = await Sharing.isAvailableAsync();
          if (!canShare) {
            setBackupJsonData(jsonData);
            setShowBackupDataModal(true);
            return;
          }
          
          await Sharing.shareAsync(backupFile.uri, {
            mimeType: "application/json",
            dialogTitle: "Save Mental Bank Backup",
          });
        } catch (fileError: any) {
          console.error("File system error:", fileError);
          setBackupJsonData(jsonData);
          setShowBackupDataModal(true);
        }
      }
    } catch (error) {
      console.error("Failed to create backup:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      if (Platform.OS === "web") {
        window.alert("Error: Failed to create backup: " + errorMessage);
      } else {
        Alert.alert("Error", `Failed to create backup: ${errorMessage}`);
      }
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    const confirmRestore = () => {
      if (Platform.OS === "web") {
        return window.confirm("Restore from Backup\n\nThis will replace all your current data with the backup. Are you sure?");
      }
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          "Restore from Backup",
          "This will replace all your current data with the backup. Are you sure?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Continue", onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) }
        );
      });
    };

    const confirmed = await confirmRestore();
    if (!confirmed) return;

    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            return;
          }
          setIsRestoring(true);
          try {
            const jsonContent = await file.text();
            const importResult = await storage.importAllData(jsonContent);
            if (importResult.success && importResult.details) {
              await loadData();
              const details = importResult.details;
              const backupDateFormatted = details.backupDate !== "Unknown" 
                ? new Date(details.backupDate).toLocaleString()
                : "Unknown";
              const summary = [
                `Backup Date: ${backupDateFormatted}`,
                `Value Events: ${details.valueEventsCount}`,
                `Reality Incomes: ${details.realityIncomesCount}`,
                `Affirmations: ${details.affirmationsCount}`,
                `Contract: ${details.hasContract ? "Yes" : "No"}`,
                `Profile: ${details.hasProfile ? "Yes" : "No"}`,
              ].join("\n");
              window.alert(`Restore Complete!\n\n${summary}`);
            } else {
              window.alert("Restore Failed\n\n" + (importResult.error || "The backup file could not be read."));
            }
          } catch (err: any) {
            console.error("Restore error:", err);
            window.alert("Error: Failed to restore backup. " + (err?.message || ""));
          } finally {
            setIsRestoring(false);
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/json",
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        setIsRestoring(true);
        const fileUri = result.assets[0].uri;
        const pickedFile = new ExpoFile(fileUri);
        const jsonContent = await pickedFile.text();

        const importResult = await storage.importAllData(jsonContent);

        if (importResult.success && importResult.details) {
          await loadData();
          const details = importResult.details;
          const backupDateFormatted = details.backupDate !== "Unknown" 
            ? new Date(details.backupDate).toLocaleString()
            : "Unknown";
          const summary = [
            `Backup Date: ${backupDateFormatted}`,
            `Value Events: ${details.valueEventsCount}`,
            `Reality Incomes: ${details.realityIncomesCount}`,
            `Affirmations: ${details.affirmationsCount}`,
            `Contract: ${details.hasContract ? "Yes" : "No"}`,
            `Profile: ${details.hasProfile ? "Yes" : "No"}`,
          ].join("\n");
          Alert.alert(
            "Restore Complete",
            summary
          );
        } else {
          Alert.alert(
            "Restore Failed",
            importResult.error || "The backup file could not be read."
          );
        }
      }
    } catch (error) {
      console.error("Failed to restore:", error);
      Alert.alert("Error", "Failed to restore backup. Please try again.");
      setIsRestoring(false);
    }
  };

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundRoot }}>
      <View style={styles.container}>
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Profile
          </ThemedText>
          <Pressable
            style={[
              styles.profileCard,
              { backgroundColor: colors.surface },
            ]}
            onPress={openProfileModal}
            testID="profile-setting"
          >
            <Image
              source={require("@/assets/images/avatar-preset.png")}
              style={styles.avatar}
              resizeMode="contain"
            />
            <View style={styles.profileInfo}>
              <ThemedText style={[styles.profileName, { color: colors.text }]}>
                {profile?.displayName || "Mental Bank User"}
              </ThemedText>
              <ThemedText
                style={[styles.profileSubtitle, { color: colors.textSecondary }]}
              >
                Prosperity Tracker
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Preferences
          </ThemedText>

          <Pressable
            style={[styles.settingRow, { backgroundColor: colors.surface }]}
            onPress={() => setShowFormatModal(true)}
            testID="export-format-setting"
          >
            <View style={styles.settingInfo}>
              <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
                Export Format
              </ThemedText>
              <ThemedText
                style={[styles.settingValue, { color: colors.textSecondary }]}
              >
                {settings?.exportFormat?.toUpperCase() || "CSV"}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Mental Bank Practice
          </ThemedText>

          <Pressable
            style={[styles.settingRow, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate("Affirmations")}
            testID="affirmations-setting"
          >
            <View style={styles.settingIconRow}>
              <View style={[styles.settingIcon, { backgroundColor: colors.secondary + "20" }]}>
                <Feather name="heart" size={18} color={colors.secondary} />
              </View>
              <View style={styles.settingInfo}>
                <ThemedText style={[styles.settingLabel, { color: colors.text }]}>
                  Affirmations Library
                </ThemedText>
                <ThemedText
                  style={[styles.settingValue, { color: colors.textSecondary }]}
                >
                  Manage your daily affirmations
                </ThemedText>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Backup & Restore
          </ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Save your data before updates to prevent data loss
          </ThemedText>

          <Pressable
            style={[styles.backupRow, { backgroundColor: colors.surface }]}
            onPress={handleBackup}
            disabled={isBackingUp}
          >
            <View style={[styles.backupIcon, { backgroundColor: colors.primary + "20" }]}>
              {isBackingUp ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Feather name="upload-cloud" size={20} color={colors.primary} />
              )}
            </View>
            <View style={styles.backupInfo}>
              <ThemedText style={[styles.backupTitle, { color: colors.text }]}>
                Create Backup
              </ThemedText>
              <ThemedText style={[styles.backupSubtitle, { color: colors.textSecondary }]}>
                Export all data to a file you can save
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.backupRow, { backgroundColor: colors.surface }]}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            <View style={[styles.backupIcon, { backgroundColor: colors.secondary + "20" }]}>
              {isRestoring ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : (
                <Feather name="download-cloud" size={20} color={colors.secondary} />
              )}
            </View>
            <View style={styles.backupInfo}>
              <ThemedText style={[styles.backupTitle, { color: colors.text }]}>
                Restore from Backup
              </ThemedText>
              <ThemedText style={[styles.backupSubtitle, { color: colors.textSecondary }]}>
                Import data from a backup file
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Data Management
          </ThemedText>

          <Button
            title="Export Ledger Data"
            onPress={handleExport}
            variant="outline"
            style={styles.actionButton}
          />

          <Button
            title="Reset Ledger Balance"
            onPress={handleResetBalance}
            variant="outline"
            style={[styles.actionButton, { borderColor: colors.danger }]}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </ThemedText>
          <ThemedText
            style={[styles.aboutText, { color: colors.textSecondary }]}
          >
            Mental Bank App v{Constants.expoConfig?.version || "1.1.4"}
          </ThemedText>
          <ThemedText
            style={[styles.aboutText, { color: colors.textSecondary }]}
          >
            Based on the Mental Bank practice developed by John Kappas
          </ThemedText>
        </View>
      </View>

      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.modalTitle}>Edit Profile</ThemedText>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.backgroundSecondary,
                  color: colors.text,
                  borderColor: colors.backgroundTertiary,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Display Name"
              placeholderTextColor={colors.textSecondary}
              testID="profile-name-input"
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowProfileModal(false)}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={saveProfile}
                testID="save-profile-button"
              >
                <ThemedText style={[styles.modalButtonText, { color: "#fff" }]}>Save</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFormatModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.modalTitle}>Export Format</ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Choose how to export your ledger data
            </ThemedText>
            <Pressable
              style={[
                styles.formatOption,
                {
                  backgroundColor: settings?.exportFormat === "csv" ? colors.primary : colors.backgroundSecondary,
                },
              ]}
              onPress={() => selectExportFormat("csv")}
              testID="csv-format-option"
            >
              <Feather
                name="file-text"
                size={20}
                color={settings?.exportFormat === "csv" ? "#fff" : colors.text}
              />
              <ThemedText
                style={[
                  styles.formatOptionText,
                  { color: settings?.exportFormat === "csv" ? "#fff" : colors.text },
                ]}
              >
                CSV (Spreadsheet)
              </ThemedText>
              {settings?.exportFormat === "csv" ? (
                <Feather name="check" size={20} color="#fff" />
              ) : null}
            </Pressable>
            <Pressable
              style={[
                styles.formatOption,
                {
                  backgroundColor: settings?.exportFormat === "pdf" ? colors.primary : colors.backgroundSecondary,
                },
              ]}
              onPress={() => selectExportFormat("pdf")}
              testID="pdf-format-option"
            >
              <Feather
                name="file"
                size={20}
                color={settings?.exportFormat === "pdf" ? "#fff" : colors.text}
              />
              <ThemedText
                style={[
                  styles.formatOptionText,
                  { color: settings?.exportFormat === "pdf" ? "#fff" : colors.text },
                ]}
              >
                PDF (Document)
              </ThemedText>
              {settings?.exportFormat === "pdf" ? (
                <Feather name="check" size={20} color="#fff" />
              ) : null}
            </Pressable>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary, marginTop: Spacing.lg }]}
              onPress={() => setShowFormatModal(false)}
            >
              <ThemedText style={styles.modalButtonText}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBackupDataModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBackupDataModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.backupModalContent, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.modalTitle}>Your Backup Data</ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Copy this data and save it to a text file
            </ThemedText>
            <Pressable
              style={[styles.copyButton, { backgroundColor: colors.primary }]}
              onPress={handleCopyBackupData}
            >
              <Feather name="copy" size={18} color="#fff" />
              <ThemedText style={[styles.copyButtonText, { color: "#fff" }]}>
                Copy to Clipboard
              </ThemedText>
            </Pressable>
            <ScrollView 
              style={[styles.backupDataScroll, { backgroundColor: colors.backgroundSecondary }]}
              contentContainerStyle={styles.backupDataContent}
            >
              <TextInput
                style={[styles.backupDataText, { color: colors.text }]}
                value={backupJsonData}
                multiline
                editable={false}
                selectTextOnFocus
              />
            </ScrollView>
            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary, marginTop: Spacing.md }]}
              onPress={() => setShowBackupDataModal(false)}
            >
              <ThemedText style={styles.modalButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  profileSubtitle: {
    ...Typography.small,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingIconRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingLabel: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  settingValue: {
    ...Typography.small,
  },
  settingSubtext: {
    ...Typography.caption,
    fontStyle: "italic",
  },
  actionButton: {
    marginBottom: Spacing.md,
  },
  aboutText: {
    ...Typography.small,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  modalSubtitle: {
    ...Typography.small,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalInput: {
    ...Typography.body,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  currencyPrefix: {
    ...Typography.h3,
    marginRight: Spacing.sm,
  },
  rateInput: {
    flex: 1,
    marginBottom: 0,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  modalButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  formatOptionText: {
    ...Typography.body,
    flex: 1,
    fontWeight: "500",
  },
  sectionDescription: {
    ...Typography.small,
    marginBottom: Spacing.lg,
  },
  backupRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  backupIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  backupInfo: {
    flex: 1,
  },
  backupTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  backupSubtitle: {
    ...Typography.small,
  },
  backupModalContent: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "80%",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  copyButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  backupDataScroll: {
    flex: 1,
    minHeight: 200,
    maxHeight: 300,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  backupDataContent: {
    flexGrow: 1,
  },
  backupDataText: {
    ...Typography.caption,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 10,
  },
});
