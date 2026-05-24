import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { ValueEvent, RealityIncome } from "@/utils/types";
import {
  formatCurrency,
  calculateDailyTotal,
  calculateNetDailyTotal,
  calculateNetRunningBalance,
  formatDate,
  parseDateString,
  getDaysInMonth,
} from "@/utils/calculations";

interface DayData {
  date: string;
  total: number;
  eventCount: number;
  runningBalance: number;
}

interface CalendarScreenProps {
  navigation: any;
}

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  const { theme: colors } = useTheme();
  const [allEvents, setAllEvents] = useState<ValueEvent[]>([]);
  const [allIncomes, setAllIncomes] = useState<RealityIncome[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [recentDays, setRecentDays] = useState<DayData[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [events, incomes] = await Promise.all([
        storage.getAllValueEvents(),
        storage.getAllRealityIncomes(),
      ]);
      setAllEvents(events);
      setAllIncomes(incomes);
      generateRecentDays(events, incomes);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const generateRecentDays = (events: ValueEvent[], incomes: RealityIncome[]) => {
    const days: DayData[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date);

      const dayEvents = events.filter((e) => e.date === dateStr);
      const dayIncomes = incomes.filter((inc) => inc.date === dateStr);
      const netTotal = calculateNetDailyTotal(dayEvents, dayIncomes);
      const entryCount = dayEvents.length + dayIncomes.length;
      const runningBalance = calculateNetRunningBalance(events, incomes, dateStr);

      days.push({
        date: dateStr,
        total: netTotal,
        eventCount: entryCount,
        runningBalance,
      });
    }

    setRecentDays(days);
  };

  const handleDayPress = (dateStr: string) => {
    navigation.navigate("LedgerTab", {
      screen: "LedgerMain",
      params: { selectedDate: dateStr },
    });
  };

  const renderDayRow = ({ item }: { item: DayData }) => {
    const date = parseDateString(item.date);
    const isToday =
      formatDate(new Date()) === item.date;

    return (
      <Pressable
        style={[
          styles.dayRow,
          {
            backgroundColor: colors.surface,
            borderLeftWidth: 3,
            borderLeftColor:
              item.eventCount > 0 ? colors.primary : colors.backgroundTertiary,
          },
        ]}
        onPress={() => handleDayPress(item.date)}
      >
        <View style={styles.dayInfo}>
          <ThemedText style={[styles.dayDate, { color: colors.text }]}>
            {date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {isToday ? (
              <ThemedText
                style={[styles.todayBadge, { color: colors.primary }]}
              >
                {" "}
                • Today
              </ThemedText>
            ) : null}
          </ThemedText>
          <ThemedText
            style={[styles.eventCount, { color: colors.textSecondary }]}
          >
            {item.eventCount}{" "}
            {item.eventCount === 1 ? "entry" : "entries"}
          </ThemedText>
        </View>
        <View style={styles.balanceContainer}>
          <ThemedText
            style={[
              styles.dayTotal,
              {
                color:
                  item.total > 0
                    ? colors.positive
                    : item.total < 0
                      ? colors.danger
                      : colors.textSecondary,
              },
            ]}
          >
            {item.total < 0 ? "-" : ""}{formatCurrency(Math.abs(item.total))}
          </ThemedText>
          <ThemedText
            style={[styles.runningBalance, { color: colors.textSecondary }]}
          >
            Balance: {item.runningBalance < 0 ? "-" : ""}
            {formatCurrency(Math.abs(item.runningBalance))}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("@/assets/images/empty-calendar.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText
        style={[styles.emptyText, { color: colors.textSecondary }]}
      >
        No entries yet
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtext, { color: colors.textSecondary }]}
      >
        Start adding value events and reality income to see your history
      </ThemedText>
    </View>
  );

  return (
    <ScreenScrollView style={{ backgroundColor: colors.backgroundRoot }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Recent Activity
          </ThemedText>
          <ThemedText
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Last 30 days
          </ThemedText>
        </View>

        {recentDays.length > 0 ? (
          <View>
            {recentDays.map((item) => (
              <View key={item.date}>{renderDayRow({ item })}</View>
            ))}
          </View>
        ) : (
          renderEmpty()
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  dayInfo: {
    flex: 1,
  },
  dayDate: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  todayBadge: {
    fontWeight: "700",
  },
  eventCount: {
    ...Typography.small,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  dayTotal: {
    ...Typography.h4,
    fontWeight: "600",
  },
  runningBalance: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  emptyText: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  emptySubtext: {
    ...Typography.small,
    textAlign: "center",
  },
});
