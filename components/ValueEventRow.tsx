import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { ValueEvent } from "@/utils/types";
import { formatCurrency } from "@/utils/calculations";

interface ValueEventRowProps {
  event: ValueEvent;
  onPress: () => void;
  onDelete: () => void;
}

export function ValueEventRow({
  event,
  onPress,
  onDelete,
}: ValueEventRowProps) {
  const { theme: colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        styles.container,
        { backgroundColor: colors.surface },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.editArea}
      >
        <View style={styles.leftContent}>
          <ThemedText style={styles.description} numberOfLines={1}>
            {event.description}
          </ThemedText>
          <ThemedText
            style={[styles.detail, { color: colors.textSecondary }]}
          >
            {event.units} {event.unitType} × {formatCurrency(event.payRate)}
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.amount,
            { color: colors.positive, fontFamily: Fonts?.mono || "monospace" },
          ]}
        >
          {formatCurrency(event.amount)}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={onDelete}
        style={[styles.deleteButton, { backgroundColor: colors.backgroundSecondary }]}
        hitSlop={Spacing.sm}
        accessibilityLabel="Delete value event"
        accessibilityRole="button"
        testID="delete-event-button"
      >
        <Feather name="trash-2" size={18} color={colors.danger} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  editArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  leftContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  description: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  detail: {
    ...Typography.small,
  },
  amount: {
    ...Typography.currency,
    fontWeight: "600",
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
