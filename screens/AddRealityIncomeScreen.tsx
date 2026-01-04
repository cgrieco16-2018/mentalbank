import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { StyledInput } from "@/components/StyledInput";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius, Fonts } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { RealityIncome } from "@/utils/types";
import { formatCurrency } from "@/utils/calculations";

interface AddRealityIncomeScreenProps {
  route: {
    params?: {
      income?: RealityIncome;
      date: string;
    };
  };
  navigation: any;
}

export default function AddRealityIncomeScreen({
  route,
  navigation,
}: AddRealityIncomeScreenProps) {
  const { theme: colors } = useTheme();
  const { income, date } = route.params || { date: "" };

  const [description, setDescription] = useState(income?.description || "");
  const [amount, setAmount] = useState(income?.amount?.toString() || "");
  const [source, setSource] = useState(income?.source || "");

  const parsedAmount = parseFloat(amount) || 0;

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert("Required Field", "Please enter a description.");
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than zero.");
      return;
    }

    const realityIncome: RealityIncome = {
      id: income?.id || Date.now().toString(),
      date: date,
      description: description.trim(),
      amount: parsedAmount,
      source: source.trim() || undefined,
    };

    try {
      await storage.saveRealityIncome(realityIncome);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save reality income:", error);
      Alert.alert("Error", "Failed to save reality income. Please try again.");
    }
  };

  const isValid = description.trim() && parsedAmount > 0;

  return (
    <ScreenKeyboardAwareScrollView
      style={{ backgroundColor: colors.backgroundRoot }}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
          Reality Income is actual money received (business revenue, salary, payments). 
          It will be subtracted from your daily deposits to calculate your net total.
        </ThemedText>
      </View>

      <StyledInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Client payment, Salary deposit, etc."
        multiline
        maxLength={200}
      />

      <StyledInput
        label="Amount Received"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="1000"
        leftIcon={
          <ThemedText style={{ color: colors.textSecondary }}>$</ThemedText>
        }
      />

      <StyledInput
        label="Source (Optional)"
        value={source}
        onChangeText={setSource}
        placeholder="Business, Employer, Client name, etc."
        maxLength={100}
      />

      <View
        style={[
          styles.previewCard,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <ThemedText style={[styles.previewLabel, { color: colors.textSecondary }]}>
          Amount to Deduct
        </ThemedText>
        <ThemedText
          style={[
            styles.previewAmount,
            { color: colors.danger, fontFamily: Fonts?.mono || "monospace" },
          ]}
        >
          -{formatCurrency(parsedAmount)}
        </ThemedText>
      </View>

      <Button
        title={income ? "Update Reality Income" : "Add Reality Income"}
        onPress={handleSave}
        disabled={!isValid}
      />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: Spacing["2xl"],
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    ...Typography.small,
    lineHeight: 20,
  },
  previewCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  previewLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  previewAmount: {
    ...Typography.largeTitle,
    fontWeight: "700",
  },
});
