import React, { useState, useCallback } from "react";
import { View, StyleSheet, Alert, Pressable, Modal, ScrollView, Platform, TextInput } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { StyledInput } from "@/components/StyledInput";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { Contract } from "@/utils/types";
import { formatCurrency, formatDate, parseDateString } from "@/utils/calculations";

const GOAL_GUIDANCE_TEXT = `Annual Income Goal – Mental Bank Guidance

Your Annual Income Goal should be set just beyond your current reality to gently expand your comfort zone without triggering resistance.

Start by identifying your current annual income.
Your Mental Bank Annual Goal is then calculated as approximately twice that amount.

This is not a prediction or pressure target. It is a symbolic success marker used to program your subconscious to accept a higher level of normal. The goal should feel slightly challenging yet believable — close enough to be accepted, far enough to create growth.`;

export default function ContractScreen() {
  const { theme: colors } = useTheme();
  const insets = useScreenInsets({ transparentHeader: true });

  const [annualGoal, setAnnualGoal] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webDateInput, setWebDateInput] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadContract();
    }, [])
  );

  const loadContract = async () => {
    try {
      const contract = await storage.getContract();
      if (contract) {
        setAnnualGoal(contract.annualGoal.toString());
        const parsedDate = parseDateString(contract.startDate);
        setStartDate(parsedDate);
        setWebDateInput(contract.startDate);
      }
    } catch (error) {
      console.error("Failed to load contract:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatedPayRate = annualGoal && parseFloat(annualGoal) > 0 
    ? parseFloat(annualGoal) / 1000 
    : 0;

  const handleSave = async () => {
    const goalNum = parseFloat(annualGoal);

    if (isNaN(goalNum) || goalNum <= 0) {
      Alert.alert("Invalid Goal", "Please enter a valid annual income goal.");
      return;
    }

    // Use existing start date or set to today if new contract
    const contractStartDate = startDate || new Date();
    
    const contract: Contract = {
      annualGoal: goalNum,
      mentalPayRate: goalNum / 1000,
      startDate: formatDate(contractStartDate),
    };
    
    // Update local state if this was a new contract
    if (!startDate) {
      setStartDate(contractStartDate);
    }

    try {
      await storage.saveContract(contract);
      Alert.alert("Success", "Your contract has been saved successfully!");
    } catch (error) {
      console.error("Failed to save contract:", error);
      Alert.alert("Error", "Failed to save contract. Please try again.");
    }
  };

  const dailyGoal = annualGoal ? (parseFloat(annualGoal) / 365).toFixed(2) : "0";
  const weeklyGoal = annualGoal ? (parseFloat(annualGoal) / 52).toFixed(2) : "0";
  const monthlyGoal = annualGoal ? (parseFloat(annualGoal) / 12).toFixed(2) : "0";

  if (loading) {
    return null;
  }

  return (
    <ScreenKeyboardAwareScrollView
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      style={{ backgroundColor: colors.backgroundRoot }}
    >
      <View style={styles.heroSection}>
        <ThemedText style={[styles.heroTitle, { color: colors.text }]}>
          Set Your Annual Prosperity Goal
        </ThemedText>
        <ThemedText
          style={[styles.heroSubtitle, { color: colors.textSecondary }]}
        >
          Define your income goal to start tracking your value creation
        </ThemedText>
      </View>

      <View style={styles.formSection}>
        <View style={styles.labelRow}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Annual Income Goal
          </ThemedText>
          <Pressable
            onPress={() => setShowGuidance(true)}
            style={[styles.infoButton, { backgroundColor: colors.primary + "20" }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="help-circle" size={18} color={colors.primary} />
          </Pressable>
        </View>
        <StyledInput
          value={annualGoal}
          onChangeText={setAnnualGoal}
          keyboardType="decimal-pad"
          placeholder="100000"
          leftIcon={
            <ThemedText style={{ color: colors.textSecondary }}>$</ThemedText>
          }
        />

        <View style={[styles.payRateDisplay, { backgroundColor: colors.backgroundSecondary }]}>
          <View>
            <ThemedText style={[styles.payRateLabel, { color: colors.textSecondary }]}>
              Mental Pay Rate
            </ThemedText>
            <ThemedText style={[styles.payRateFormula, { color: colors.textSecondary }]}>
              Annual Goal / 1000
            </ThemedText>
          </View>
          <ThemedText style={[styles.payRateValue, { color: colors.text }]}>
            {formatCurrency(calculatedPayRate)}/hr
          </ThemedText>
        </View>

        <View style={styles.dateSection}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Contract Start Date
          </ThemedText>
          {Platform.OS === "web" ? (
            <View style={[styles.dateDisplay, { backgroundColor: colors.backgroundSecondary, borderColor: colors.backgroundTertiary }]}>
              <Feather name="calendar" size={18} color={colors.primary} />
              <TextInput
                style={[styles.webDateInput, { color: colors.text }]}
                value={webDateInput}
                onChangeText={(text) => {
                  setWebDateInput(text);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                    setStartDate(parseDateString(text));
                  }
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
              <Feather name="edit-2" size={14} color={colors.textSecondary} />
            </View>
          ) : (
            <Pressable 
              style={[styles.dateDisplay, { backgroundColor: colors.backgroundSecondary, borderColor: colors.backgroundTertiary }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Feather name="calendar" size={18} color={colors.primary} />
              <ThemedText style={[styles.dateText, { color: colors.text }]}>
                {startDate ? formatDate(startDate).replace(/-/g, '/') : "Tap to set date"}
              </ThemedText>
              <Feather name="edit-2" size={14} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {showDatePicker && Platform.OS === "ios" ? (
          <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setStartDate(selectedDate);
                  setWebDateInput(formatDate(selectedDate));
                }
              }}
            />
            <Button 
              title="Done" 
              onPress={() => setShowDatePicker(false)}
              variant="outline"
            />
          </View>
        ) : null}
        {showDatePicker && Platform.OS === "android" ? (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setStartDate(selectedDate);
                setWebDateInput(formatDate(selectedDate));
              }
            }}
          />
        ) : null}

        {annualGoal && parseFloat(annualGoal) > 0 ? (
          <View
            style={[
              styles.breakdownCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <ThemedText
              style={[styles.breakdownTitle, { color: colors.text }]}
            >
              Goal Breakdown
            </ThemedText>
            <View style={styles.breakdownRow}>
              <ThemedText style={{ color: colors.textSecondary }}>
                Daily:
              </ThemedText>
              <ThemedText style={[styles.breakdownAmount, { color: colors.text }]}>
                {formatCurrency(parseFloat(dailyGoal))}
              </ThemedText>
            </View>
            <View style={styles.breakdownRow}>
              <ThemedText style={{ color: colors.textSecondary }}>
                Weekly:
              </ThemedText>
              <ThemedText style={[styles.breakdownAmount, { color: colors.text }]}>
                {formatCurrency(parseFloat(weeklyGoal))}
              </ThemedText>
            </View>
            <View style={styles.breakdownRow}>
              <ThemedText style={{ color: colors.textSecondary }}>
                Monthly:
              </ThemedText>
              <ThemedText style={[styles.breakdownAmount, { color: colors.text }]}>
                {formatCurrency(parseFloat(monthlyGoal))}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <Button title="Save Contract" onPress={handleSave} />
      </View>

      <Modal
        visible={showGuidance}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuidance(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setShowGuidance(false)}
          />
          <View 
            style={[styles.modalContent, { backgroundColor: colors.backgroundDefault }]}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="info" size={24} color={colors.primary} />
              </View>
              <Pressable
                onPress={() => setShowGuidance(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <ThemedText style={[styles.modalText, { color: colors.text }]}>
                {GOAL_GUIDANCE_TEXT}
              </ThemedText>
            </ScrollView>
            <Button 
              title="Got it" 
              onPress={() => setShowGuidance(false)} 
            />
          </View>
        </View>
      </Modal>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Spacing["2xl"],
  },
  heroSection: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  heroTitle: {
    ...Typography.largeTitle,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    ...Typography.body,
    textAlign: "center",
    maxWidth: 400,
  },
  formSection: {
    marginBottom: Spacing["4xl"],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.body,
    fontWeight: "600",
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payRateDisplay: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payRateLabel: {
    ...Typography.small,
    fontWeight: "500",
  },
  payRateFormula: {
    ...Typography.caption,
    fontStyle: "italic",
  },
  payRateValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  dateSection: {
    marginBottom: Spacing.lg,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  dateText: {
    ...Typography.body,
    flex: 1,
  },
  webDateInput: {
    ...Typography.body,
    flex: 1,
    padding: 0,
    margin: 0,
  },
  datePickerContainer: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  breakdownCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing["2xl"],
  },
  breakdownTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  breakdownAmount: {
    ...Typography.body,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxWidth: 500,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollView: {
    marginBottom: Spacing.lg,
    maxHeight: 350,
  },
  modalScrollContent: {
    paddingBottom: Spacing.sm,
  },
  modalText: {
    ...Typography.body,
    lineHeight: 24,
  },
});
