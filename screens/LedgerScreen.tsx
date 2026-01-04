import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  Image,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ValueEventRow } from "@/components/ValueEventRow";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import {
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  Fonts,
} from "@/constants/theme";
import { storage } from "@/utils/storage";
import { ValueEvent, ValueEventDefinition, Contract, DayHappenings, DrawingPath, Affirmation, DailyAffirmations, RealityIncome, ValueEventRecurrence, RECURRENCE_OPTIONS } from "@/utils/types";
import {
  formatCurrency,
  calculateDailyTotal,
  calculateRunningBalance,
  calculateGoalProgress,
  formatDate,
  parseDateString,
  calculateWeeklyTotal,
  calculateMonthlyTotal,
  calculateWeeklyGoal,
  calculateMonthlyGoal,
  calculateRealityIncomeTotal,
  calculateNetDailyTotal,
  calculateNetRunningBalance,
  calculateNetWeeklyTotal,
  calculateNetMonthlyTotal,
} from "@/utils/calculations";

interface LedgerScreenProps {
  navigation: any;
  route?: {
    params?: {
      selectedDate?: string;
    };
  };
}

export default function LedgerScreen({ navigation, route }: LedgerScreenProps) {
  const { theme: colors } = useTheme();
  const insets = useScreenInsets({ transparentHeader: true });

  const initialDate = route?.params?.selectedDate
    ? parseDateString(route.params.selectedDate)
    : new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [events, setEvents] = useState<ValueEvent[]>([]);
  const [allEvents, setAllEvents] = useState<ValueEvent[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHappenings, setShowHappenings] = useState(false);
  const [happenings, setHappenings] = useState<DayHappenings | null>(null);
  const [notesText, setNotesText] = useState("");
  const [activeTab, setActiveTab] = useState<"type" | "draw">("type");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [allAffirmations, setAllAffirmations] = useState<Affirmation[]>([]);
  const [selectedAffirmationIds, setSelectedAffirmationIds] = useState<string[]>([]);
  const [dailyAffirmations, setDailyAffirmations] = useState<DailyAffirmations | null>(null);
  const [realityIncomes, setRealityIncomes] = useState<RealityIncome[]>([]);
  const [allRealityIncomes, setAllRealityIncomes] = useState<RealityIncome[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null);
  const [newAffirmationText, setNewAffirmationText] = useState("");
  const [isAddingAffirmation, setIsAddingAffirmation] = useState(false);
  const [showWeekReview, setShowWeekReview] = useState(false);
  const [showMonthReview, setShowMonthReview] = useState(false);
  const [definitions, setDefinitions] = useState<ValueEventDefinition[]>([]);

  useEffect(() => {
    if (route?.params?.selectedDate) {
      setSelectedDate(parseDateString(route.params.selectedDate));
    }
  }, [route?.params?.selectedDate]);

  useFocusEffect(
    useCallback(() => {
      if (!route?.params?.selectedDate) {
        const today = new Date();
        setSelectedDate(today);
        loadData(today);
      } else {
        loadData(selectedDate);
      }
    }, [route?.params?.selectedDate])
  );

  const loadData = async (dateToLoad: Date = selectedDate) => {
    try {
      const dateStr = formatDate(dateToLoad);
      const [contractData, allEventsData, happeningsData, affirmationsData, dailyAffirmationsData, allIncomesData, definitionsData] = await Promise.all([
        storage.getContract(),
        storage.getAllValueEvents(),
        storage.getHappeningsByDate(dateStr),
        storage.getAllAffirmations(),
        storage.getDailyAffirmationsByDate(dateStr),
        storage.getAllRealityIncomes(),
        storage.getAllValueEventDefinitions(),
      ]);

      setContract(contractData);
      setAllEvents(allEventsData);
      setAllAffirmations(affirmationsData);
      setAllRealityIncomes(allIncomesData);
      setDefinitions(definitionsData.filter((d) => d.isActive));
      
      const validAffirmationIds = affirmationsData.map((a) => a.id);
      const savedIds = dailyAffirmationsData?.affirmationIds || [];
      const filteredIds = savedIds.filter((id) => validAffirmationIds.includes(id));
      
      if (filteredIds.length !== savedIds.length && dailyAffirmationsData) {
        const correctedDaily: DailyAffirmations = {
          ...dailyAffirmationsData,
          affirmationIds: filteredIds,
        };
        await storage.saveDailyAffirmations(correctedDaily);
        setDailyAffirmations(correctedDaily);
      } else {
        setDailyAffirmations(dailyAffirmationsData);
      }
      setSelectedAffirmationIds(filteredIds);

      const dayEvents = allEventsData.filter((e) => e.date === dateStr);
      setEvents(dayEvents);

      const dayIncomes = allIncomesData.filter((i) => i.date === dateStr);
      setRealityIncomes(dayIncomes);

      setHappenings(happeningsData);
      setNotesText(happeningsData?.notes || "");
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = useCallback(() => {
    navigation.navigate("AddValueEvent", {
      date: formatDate(selectedDate),
      defaultPayRate: contract?.mentalPayRate || 0,
    });
  }, [navigation, selectedDate, contract]);

  const handleEditEvent = useCallback((event: ValueEvent) => {
    navigation.navigate("AddValueEvent", {
      event,
      date: formatDate(selectedDate),
      defaultPayRate: contract?.mentalPayRate || 0,
    });
  }, [navigation, selectedDate, contract]);

  const handleAddRealityIncome = useCallback(() => {
    setShowAddMenu(false);
    navigation.navigate("AddRealityIncome", {
      date: formatDate(selectedDate),
    });
  }, [navigation, selectedDate]);

  const handleEditRealityIncome = useCallback((income: RealityIncome) => {
    navigation.navigate("AddRealityIncome", {
      income,
      date: formatDate(selectedDate),
    });
  }, [navigation, selectedDate]);

  const handleDeleteEvent = (eventId: string) => {
    setDeleteConfirmId(eventId);
  };

  const handleDeleteIncome = (incomeId: string) => {
    setDeleteIncomeId(incomeId);
  };

  const confirmDeleteIncome = async () => {
    if (!deleteIncomeId) return;
    try {
      await storage.deleteRealityIncome(deleteIncomeId);
      setDeleteIncomeId(null);
      await loadData();
    } catch (error) {
      console.error("Failed to delete reality income:", error);
      Alert.alert("Error", "Failed to delete reality income. Please try again.");
    }
  };

  const cancelDeleteIncome = () => {
    setDeleteIncomeId(null);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await storage.deleteValueEvent(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadData();
    } catch (error) {
      console.error("Failed to delete event:", error);
      Alert.alert("Error", "Failed to delete event. Please try again.");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleSaveNotes = async () => {
    try {
      const dateStr = formatDate(selectedDate);
      const updatedHappenings: DayHappenings = {
        date: dateStr,
        notes: notesText,
        drawingPaths: happenings?.drawingPaths || [],
      };
      await storage.saveDayHappenings(updatedHappenings);
      setHappenings(updatedHappenings);
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  };

  const handleSaveDrawing = async (paths: DrawingPath[]) => {
    try {
      const dateStr = formatDate(selectedDate);
      const updatedHappenings: DayHappenings = {
        date: dateStr,
        notes: happenings?.notes || "",
        drawingPaths: paths,
      };
      await storage.saveDayHappenings(updatedHappenings);
      setHappenings(updatedHappenings);
    } catch (error) {
      console.error("Failed to save drawing:", error);
    }
  };

  const handleToggleAffirmation = async (affirmationId: string) => {
    const dateStr = formatDate(selectedDate);
    const isSelected = selectedAffirmationIds.includes(affirmationId);
    
    let newSelectedIds: string[];
    if (isSelected) {
      newSelectedIds = selectedAffirmationIds.filter((id) => id !== affirmationId);
    } else {
      newSelectedIds = [...selectedAffirmationIds, affirmationId];
      await storage.incrementAffirmationUsage(affirmationId);
    }
    
    setSelectedAffirmationIds(newSelectedIds);
    
    const updatedDaily: DailyAffirmations = {
      date: dateStr,
      affirmationIds: newSelectedIds,
    };
    await storage.saveDailyAffirmations(updatedDaily);
    setDailyAffirmations(updatedDaily);
  };

  const handleAddQuickAffirmation = async () => {
    const trimmedText = newAffirmationText.trim();
    if (!trimmedText) return;
    
    setIsAddingAffirmation(true);
    try {
      const newAffirmation: Affirmation = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: trimmedText,
        category: "general",
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };
      
      await storage.saveAffirmation(newAffirmation);
      
      // Add to local list and auto-select it
      setAllAffirmations((prev) => [...prev, newAffirmation]);
      setNewAffirmationText("");
      
      // Auto-select the new affirmation for today
      const dateStr = formatDate(selectedDate);
      const newSelectedIds = [...selectedAffirmationIds, newAffirmation.id];
      setSelectedAffirmationIds(newSelectedIds);
      
      const updatedDaily: DailyAffirmations = {
        date: dateStr,
        affirmationIds: newSelectedIds,
      };
      await storage.saveDailyAffirmations(updatedDaily);
      setDailyAffirmations(updatedDaily);
    } catch (error) {
      console.error("Failed to save affirmation:", error);
      Alert.alert("Error", "Failed to save affirmation. Please try again.");
    } finally {
      setIsAddingAffirmation(false);
    }
  };

  const depositsTotal = calculateDailyTotal(events);
  const realityIncomeTotal = calculateRealityIncomeTotal(realityIncomes);
  const netDailyTotal = calculateNetDailyTotal(events, realityIncomes);
  const netRunningBalance = calculateNetRunningBalance(
    allEvents,
    allRealityIncomes,
    formatDate(selectedDate)
  );
  const goalProgress = calculateGoalProgress(netRunningBalance, contract);

  const netWeeklyTotal = calculateNetWeeklyTotal(allEvents, allRealityIncomes, selectedDate);
  const netMonthlyTotal = calculateNetMonthlyTotal(allEvents, allRealityIncomes, selectedDate);
  const weeklyGoal = calculateWeeklyGoal(contract);
  const monthlyGoal = calculateMonthlyGoal(contract);
  const weeklyProgress = weeklyGoal > 0 ? Math.max(0, (netWeeklyTotal / weeklyGoal) * 100) : 0;
  const monthlyProgress = monthlyGoal > 0 ? Math.max(0, (netMonthlyTotal / monthlyGoal) * 100) : 0;

  const handleAddEventFromMenu = useCallback(() => {
    setShowAddMenu(false);
    handleAddEvent();
  }, [handleAddEvent]);

  const handleOpenCalendar = useCallback(() => {
    navigation.navigate("Calendar");
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <Pressable 
            onPress={handleOpenCalendar} 
            hitSlop={Spacing.lg}
            testID="calendar-button"
            accessibilityLabel="History Calendar"
            accessibilityHint="View history by date"
            accessibilityRole="button"
            style={{ padding: Spacing.sm }}
          >
            <Feather name="calendar" size={24} color={colors.primary} />
          </Pressable>
          <Pressable 
            onPress={() => setShowAddMenu(true)} 
            hitSlop={Spacing.lg}
            testID="add-menu-button"
            accessibilityLabel="Add Entry"
            accessibilityHint="Opens menu to add value event or reality income"
            accessibilityRole="button"
            style={{ padding: Spacing.sm, zIndex: 1000 }}
          >
            <Feather name="plus" size={28} color={colors.primary} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, colors.primary, handleOpenCalendar]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("@/assets/images/empty-ledger.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <ThemedText
        style={[styles.emptyText, { color: colors.textSecondary }]}
      >
        No value events for this day
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtext, { color: colors.textSecondary }]}
      >
        Tap the + button to add your first value event
      </ThemedText>
    </View>
  );

  const getWeekDates = (date: Date): Date[] => {
    const result: Date[] = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      result.push(d);
    }
    return result;
  };

  const getMonthWeeks = (date: Date): { start: Date; end: Date; label: string }[] => {
    const result: { start: Date; end: Date; label: string }[] = [];
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    let current = new Date(firstDay);
    let weekNum = 1;
    while (current <= lastDay) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));
      if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
      
      result.push({ 
        start: new Date(weekStart), 
        end: new Date(weekEnd),
        label: `W${weekNum}`
      });
      current.setDate(current.getDate() + (7 - current.getDay()));
      weekNum++;
    }
    // Limit to 5 weeks max for better layout
    return result.slice(0, 5);
  };

  const getCompletionStatus = (
    definition: ValueEventDefinition,
    startDate: Date,
    endDate: Date
  ): { completed: number; required: number; status: "fulfilled" | "partial" | "missed" } => {
    const completions = allEvents.filter((e) => {
      const eventDate = parseDateString(e.date);
      return (
        e.valueEventDefinitionId === definition.id &&
        eventDate >= startDate &&
        eventDate <= endDate
      );
    });

    const completed = completions.length;
    let required = 0;

    switch (definition.recurrence) {
      case "daily":
        const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        required = days;
        break;
      case "weekly":
        required = 1;
        break;
      case "monthly":
        required = 1;
        break;
      case "yearly":
        required = 1;
        break;
    }

    const status: "fulfilled" | "partial" | "missed" =
      completed >= required ? "fulfilled" : completed > 0 ? "partial" : "missed";

    return { completed, required, status };
  };

  const renderWeekReview = () => {
    const weekDates = getWeekDates(selectedDate);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    const today = new Date();
    
    const weeklyDefinitions = definitions.filter(
      (d) => d.recurrence === "daily" || d.recurrence === "weekly"
    );

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const categoryColors: Record<string, string> = {
      happiness: colors.danger,
      success: colors.secondary,
      prosperity: colors.primary,
    };

    if (weeklyDefinitions.length === 0) {
      return (
        <View style={styles.reviewEmptyState}>
          <Feather name="calendar" size={40} color={colors.textSecondary} />
          <ThemedText style={[styles.reviewEmptyTitle, { color: colors.text }]}>
            No Weekly Commitments
          </ThemedText>
          <ThemedText style={[styles.reviewEmptySubtitle, { color: colors.textSecondary }]}>
            Create value events with Daily or Weekly recurrence to track your commitments here.
          </ThemedText>
        </View>
      );
    }

    return (
      <View>
        <ThemedText style={[styles.reviewPeriod, { color: colors.textSecondary }]}>
          Week of {weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - {weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </ThemedText>

        {/* Day Headers - same structure as data rows */}
        <View style={[styles.reviewEventRow, { borderBottomColor: colors.backgroundTertiary }]}>
          <View style={styles.eventNameWithDot}>
            <View style={[styles.categoryDot, { backgroundColor: 'transparent' }]} />
            <ThemedText style={[styles.reviewEventName, { color: 'transparent', flex: 1 }]}>
              Header
            </ThemedText>
          </View>
          <View style={styles.daysContainer}>
            {weekDates.map((date, idx) => {
              const isToday = formatDate(date) === formatDate(today);
              const isFuture = date > today;
              return (
                <View key={idx} style={[styles.dayColumn, styles.dayCell, { backgroundColor: 'transparent' }]}>
                  <ThemedText
                    style={[
                      styles.dayHeaderText,
                      {
                        color: isFuture ? colors.textSecondary : isToday ? colors.primary : colors.text,
                        fontWeight: isToday ? "700" : "500",
                      },
                    ]}
                  >
                    {dayNames[idx]}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.dayHeaderDate,
                      { color: isFuture ? colors.textSecondary : colors.textSecondary },
                    ]}
                  >
                    {date.getDate()}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {/* Events Grid */}
        {weeklyDefinitions.map((def) => {
          const categoryColor = categoryColors[def.category] || colors.primary;
          
          return (
            <View
              key={def.id}
              style={[styles.reviewEventRow, { borderBottomColor: colors.backgroundTertiary }]}
            >
              <View style={styles.eventNameWithDot}>
                <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                <ThemedText
                  style={[styles.reviewEventName, { color: colors.text, flex: 1 }]}
                >
                  {def.name}
                </ThemedText>
              </View>
              <View style={styles.daysContainer}>
                {weekDates.map((date, idx) => {
                  const dateStr = formatDate(date);
                  const isFuture = date > today;
                  const hasCompletion = allEvents.some(
                    (e) => e.valueEventDefinitionId === def.id && e.date === dateStr
                  );
                  
                  let cellColor = colors.backgroundSecondary;
                  let icon: string | null = null;
                  
                  if (hasCompletion) {
                    cellColor = colors.positive + "30";
                    icon = "check";
                  } else if (!isFuture && def.recurrence === "daily") {
                    cellColor = colors.danger + "20";
                    icon = "x";
                  } else if (def.recurrence === "weekly") {
                    const { status } = getCompletionStatus(def, weekStart, weekEnd);
                    if (status === "fulfilled") {
                      cellColor = colors.positive + "30";
                    }
                  }

                  return (
                    <View
                      key={idx}
                      style={[styles.dayColumn, styles.dayCell, { backgroundColor: cellColor }]}
                    >
                      {icon === "check" ? (
                        <Feather name="check" size={14} color={colors.positive} />
                      ) : icon === "x" ? (
                        <Feather name="x" size={14} color={colors.danger} />
                      ) : isFuture ? (
                        <ThemedText style={[styles.futureDot, { color: colors.textSecondary }]}>
                          -
                        </ThemedText>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Summary */}
        <View style={[styles.reviewSummary, { backgroundColor: colors.backgroundSecondary }]}>
          <ThemedText style={[styles.reviewSummaryTitle, { color: colors.text }]}>
            This Week's Summary
          </ThemedText>
          {weeklyDefinitions.map((def) => {
            const { completed, required, status } = getCompletionStatus(def, weekStart, weekEnd);
            const statusColor =
              status === "fulfilled" ? colors.positive : status === "partial" ? colors.warning : colors.danger;
            
            return (
              <View key={def.id} style={styles.summaryRow}>
                <ThemedText style={[styles.summaryEventName, { color: colors.text }]} numberOfLines={1}>
                  {def.name}
                </ThemedText>
                <View style={styles.summaryStatus}>
                  <ThemedText style={[styles.summaryCount, { color: statusColor }]}>
                    {completed}/{required}
                  </ThemedText>
                  <Feather
                    name={status === "fulfilled" ? "check-circle" : status === "partial" ? "alert-circle" : "x-circle"}
                    size={16}
                    color={statusColor}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMonthReview = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const monthName = selectedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const weeks = getMonthWeeks(selectedDate);
    const today = new Date();

    const monthlyDefinitions = definitions.filter(
      (d) => d.recurrence === "monthly" || d.recurrence === "yearly"
    );
    const weeklyDefinitions = definitions.filter(
      (d) => d.recurrence === "daily" || d.recurrence === "weekly"
    );

    const categoryColors: Record<string, string> = {
      happiness: colors.danger,
      success: colors.secondary,
      prosperity: colors.primary,
    };

    if (monthlyDefinitions.length === 0 && weeklyDefinitions.length === 0) {
      return (
        <View style={styles.reviewEmptyState}>
          <Feather name="calendar" size={40} color={colors.textSecondary} />
          <ThemedText style={[styles.reviewEmptyTitle, { color: colors.text }]}>
            No Monthly Commitments
          </ThemedText>
          <ThemedText style={[styles.reviewEmptySubtitle, { color: colors.textSecondary }]}>
            Create value events with any recurrence to track your commitments here.
          </ThemedText>
        </View>
      );
    }

    return (
      <View>
        <ThemedText style={[styles.reviewPeriod, { color: colors.textSecondary }]}>
          {monthName}
        </ThemedText>

        {/* Monthly/Yearly Events Section */}
        {monthlyDefinitions.length > 0 ? (
          <View style={styles.reviewSection}>
            <ThemedText style={[styles.reviewSectionTitle, { color: colors.text }]}>
              Monthly & Yearly Commitments
            </ThemedText>
            {monthlyDefinitions.map((def) => {
              const { completed, required, status } = getCompletionStatus(def, monthStart, monthEnd);
              const categoryColor = categoryColors[def.category] || colors.primary;
              const statusColor =
                status === "fulfilled" ? colors.positive : status === "partial" ? colors.warning : colors.danger;

              return (
                <View
                  key={def.id}
                  style={[styles.monthlyEventCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.eventNameWithDot}>
                    <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                    <View style={styles.eventNameContent}>
                      <ThemedText style={[styles.reviewEventName, { color: colors.text }]}>
                        {def.name}
                      </ThemedText>
                      <ThemedText style={[styles.reviewEventRecurrence, { color: colors.textSecondary }]}>
                        {def.recurrence}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.monthlyEventStatus}>
                    <Feather
                      name={status === "fulfilled" ? "check-circle" : status === "partial" ? "alert-circle" : "circle"}
                      size={24}
                      color={statusColor}
                    />
                    <ThemedText style={[styles.monthlyEventCount, { color: statusColor }]}>
                      {completed} time{completed !== 1 ? "s" : ""}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

      </View>
    );
  };

  const renderHeader = () => (
    <View
      style={[
        styles.totalCard,
        {
          backgroundColor: colors.surface,
          ...Shadows.floating,
        },
      ]}
    >
      <View style={styles.balanceSection}>
        <ThemedText
          style={[styles.balanceLabel, { color: colors.textSecondary }]}
        >
          Running Balance
        </ThemedText>
        <ThemedText
          style={[
            styles.balanceAmount,
            {
              color: netRunningBalance >= 0 ? colors.secondary : colors.danger,
              fontFamily: Fonts?.mono || "monospace",
            },
          ]}
        >
          {netRunningBalance < 0 ? "-" : ""}{formatCurrency(Math.abs(netRunningBalance))}
        </ThemedText>
      </View>

      <View style={styles.dailyBreakdown}>
        <View style={styles.breakdownRow}>
          <ThemedText style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
            Deposits
          </ThemedText>
          <ThemedText
            style={[styles.breakdownAmount, { color: colors.positive, fontFamily: Fonts?.mono || "monospace" }]}
          >
            {formatCurrency(depositsTotal)}
          </ThemedText>
        </View>
        {realityIncomeTotal > 0 ? (
          <View style={styles.breakdownRow}>
            <ThemedText style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Reality Income
            </ThemedText>
            <ThemedText
              style={[styles.breakdownAmount, { color: colors.danger, fontFamily: Fonts?.mono || "monospace" }]}
            >
              -{formatCurrency(realityIncomeTotal)}
            </ThemedText>
          </View>
        ) : null}
        <View style={[styles.breakdownRow, styles.netRow]}>
          <ThemedText style={[styles.netLabel, { color: colors.text }]}>
            Net Today
          </ThemedText>
          <ThemedText
            style={[
              styles.netAmount,
              {
                color: netDailyTotal >= 0 ? colors.positive : colors.danger,
                fontFamily: Fonts?.mono || "monospace",
              },
            ]}
          >
            {netDailyTotal < 0 ? "-" : ""}{formatCurrency(Math.abs(netDailyTotal))}
          </ThemedText>
        </View>
      </View>
      {contract ? (
        <View style={styles.progressContainer}>
          <View style={styles.compactProgressRow}>
            <Pressable
              style={styles.compactProgressItem}
              onPress={() => setShowWeekReview(true)}
            >
              <View style={styles.progressLabelRow}>
                <ThemedText style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  Week
                </ThemedText>
                <Feather name="chevron-right" size={12} color={colors.textSecondary} />
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: weeklyProgress >= 100 ? colors.positive : colors.secondary,
                      width: `${Math.min(weeklyProgress, 100)}%`,
                    },
                  ]}
                />
              </View>
              <ThemedText style={[styles.progressPercent, { color: weeklyProgress >= 100 ? colors.positive : colors.textSecondary }]}>
                {weeklyProgress.toFixed(0)}%
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.compactProgressItem}
              onPress={() => setShowMonthReview(true)}
            >
              <View style={styles.progressLabelRow}>
                <ThemedText style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  Month
                </ThemedText>
                <Feather name="chevron-right" size={12} color={colors.textSecondary} />
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: monthlyProgress >= 100 ? colors.positive : colors.primary,
                      width: `${Math.min(monthlyProgress, 100)}%`,
                    },
                  ]}
                />
              </View>
              <ThemedText style={[styles.progressPercent, { color: monthlyProgress >= 100 ? colors.positive : colors.textSecondary }]}>
                {monthlyProgress.toFixed(0)}%
              </ThemedText>
            </Pressable>

            <View style={styles.compactProgressItem}>
              <ThemedText style={[styles.progressLabel, { color: colors.textSecondary }]}>
                Year
              </ThemedText>
              <View style={[styles.progressBar, { backgroundColor: colors.backgroundTertiary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: goalProgress >= 100 ? colors.positive : colors.primary,
                      width: `${Math.min(goalProgress, 100)}%`,
                    },
                  ]}
                />
              </View>
              <ThemedText style={[styles.progressPercent, { color: goalProgress >= 100 ? colors.positive : colors.textSecondary }]}>
                {goalProgress.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.backgroundRoot }]}
    >
      <FlatList
        data={events}
        renderItem={({ item }) => (
          <ValueEventRow
            event={item}
            onPress={() => handleEditEvent(item)}
            onDelete={() => handleDeleteEvent(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + Spacing.minTouchTarget + Spacing.lg,
          },
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={events.length === 0 && realityIncomes.length === 0 ? renderEmpty : null}
        ListFooterComponent={
          realityIncomes.length > 0 ? (
            <View style={[styles.realityIncomeSection, { borderTopColor: colors.backgroundTertiary }]}>
              <ThemedText style={[styles.realityIncomeSectionTitle, { color: colors.text }]}>
                Reality Income (Deductions)
              </ThemedText>
              {realityIncomes.map((income) => (
                <View
                  key={income.id}
                  style={[styles.realityIncomeRow, { backgroundColor: colors.backgroundSecondary }]}
                >
                  <Pressable
                    style={styles.realityIncomeInfo}
                    onPress={() => handleEditRealityIncome(income)}
                  >
                    <ThemedText style={[styles.realityIncomeDescription, { color: colors.text }]}>
                      {income.description}
                    </ThemedText>
                    {income.source ? (
                      <ThemedText style={[styles.realityIncomeSource, { color: colors.textSecondary }]}>
                        {income.source}
                      </ThemedText>
                    ) : null}
                  </Pressable>
                  <ThemedText style={[styles.realityIncomeAmount, { color: colors.danger }]}>
                    -{formatCurrency(income.amount)}
                  </ThemedText>
                  <Pressable
                    style={styles.realityIncomeDelete}
                    onPress={() => handleDeleteIncome(income.id)}
                    hitSlop={Spacing.sm}
                  >
                    <Feather name="trash-2" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null
        }
      />

      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: colors.secondary,
            bottom: insets.bottom + Spacing.lg,
            ...Shadows.floating,
          },
        ]}
        onPress={() => setShowHappenings(true)}
        testID="happenings-fab"
        accessibilityLabel="Happenings and Notes"
        accessibilityHint="Opens journal for gratitude, affirmations, and drawing"
      >
        <Feather name="book-open" size={24} color={colors.buttonText} />
      </Pressable>

      <Modal
        visible={deleteConfirmId !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.confirmTitle}>Delete Value Event</ThemedText>
            <ThemedText style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete this value event?
            </ThemedText>
            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={cancelDelete}
                testID="delete-cancel-button"
              >
                <ThemedText style={styles.confirmButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: colors.danger }]}
                onPress={confirmDelete}
                testID="delete-confirm-button"
              >
                <ThemedText style={[styles.confirmButtonText, { color: "#fff" }]}>Delete</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteIncomeId !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteIncome}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmDialog, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.confirmTitle}>Delete Reality Income</ThemedText>
            <ThemedText style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete this reality income entry?
            </ThemedText>
            <View style={styles.confirmButtons}>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={cancelDeleteIncome}
              >
                <ThemedText style={styles.confirmButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, { backgroundColor: colors.danger }]}
                onPress={confirmDeleteIncome}
              >
                <ThemedText style={[styles.confirmButtonText, { color: "#fff" }]}>Delete</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <Pressable style={styles.addMenuOverlay} onPress={() => setShowAddMenu(false)}>
          <View style={[styles.addMenu, { backgroundColor: colors.surface, ...Shadows.floating }]}>
            <Pressable 
              style={styles.addMenuItem} 
              onPress={handleAddEventFromMenu}
              testID="add-value-event-menu-item"
            >
              <Feather name="plus-circle" size={20} color={colors.positive} />
              <ThemedText style={[styles.addMenuText, { color: colors.text }]}>Value Event</ThemedText>
            </Pressable>
            <View style={[styles.addMenuDivider, { backgroundColor: colors.backgroundTertiary }]} />
            <Pressable 
              style={styles.addMenuItem} 
              onPress={handleAddRealityIncome}
              testID="add-reality-income-menu-item"
            >
              <Feather name="dollar-sign" size={20} color={colors.danger} />
              <ThemedText style={[styles.addMenuText, { color: colors.text }]}>Reality Income</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showHappenings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHappenings(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.backgroundRoot },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.backgroundTertiary,
              },
            ]}
          >
            <Pressable
              onPress={() => setShowHappenings(false)}
              hitSlop={Spacing.sm}
            >
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
            <ThemedText style={styles.modalTitle}>
              Happenings & Notes
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tab,
                {
                  backgroundColor:
                    activeTab === "type"
                      ? colors.primary
                      : colors.backgroundSecondary,
                },
              ]}
              onPress={() => setActiveTab("type")}
            >
              <Feather
                name="type"
                size={20}
                color={activeTab === "type" ? colors.buttonText : colors.text}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "type" ? colors.buttonText : colors.text,
                  },
                ]}
              >
                Type
              </ThemedText>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                {
                  backgroundColor:
                    activeTab === "draw"
                      ? colors.primary
                      : colors.backgroundSecondary,
                },
              ]}
              onPress={() => setActiveTab("draw")}
            >
              <Feather
                name="edit-3"
                size={20}
                color={activeTab === "draw" ? colors.buttonText : colors.text}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "draw" ? colors.buttonText : colors.text,
                  },
                ]}
              >
                Draw
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ padding: Spacing.lg }}
          >
            {activeTab === "type" ? (
              <View>
                <ThemedText
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Gratitude, Affirmations, or Notes
                </ThemedText>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.backgroundTertiary,
                    },
                  ]}
                  value={notesText}
                  onChangeText={setNotesText}
                  multiline
                  placeholder="Reflect on your day, write affirmations, or note gratitude..."
                  placeholderTextColor={colors.textSecondary}
                  textAlignVertical="top"
                  onBlur={handleSaveNotes}
                />

                <View style={styles.affirmationSection}>
                  <View style={styles.affirmationHeader}>
                    <ThemedText
                      style={[
                        styles.sectionLabel,
                        { color: colors.textSecondary, marginBottom: 0 },
                      ]}
                    >
                      Tonight's Affirmations
                    </ThemedText>
                    {selectedAffirmationIds.length > 0 ? (
                      <View style={[styles.selectedBadge, { backgroundColor: colors.primary + "20" }]}>
                        <ThemedText style={[styles.selectedBadgeText, { color: colors.primary }]}>
                          {selectedAffirmationIds.length} selected
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  
                  {allAffirmations.length === 0 ? (
                    <View style={[styles.emptyAffirmations, { backgroundColor: colors.surface }]}>
                      <Feather name="heart" size={24} color={colors.textSecondary} />
                      <ThemedText style={[styles.emptyAffirmationsText, { color: colors.textSecondary }]}>
                        No affirmations yet
                      </ThemedText>
                      <ThemedText style={[styles.emptyAffirmationsHint, { color: colors.textSecondary }]}>
                        Add affirmations in Settings to select them for your nightly practice
                      </ThemedText>
                      <Pressable
                        style={[styles.addAffirmationsButton, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setShowHappenings(false);
                          navigation.navigate("SettingsTab", { screen: "Affirmations" });
                        }}
                      >
                        <Feather name="plus" size={16} color={colors.buttonText} />
                        <ThemedText style={[styles.addAffirmationsButtonText, { color: colors.buttonText }]}>
                          Add Affirmations
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.affirmationList}>
                      {allAffirmations.map((affirmation) => {
                        const isSelected = selectedAffirmationIds.includes(affirmation.id);
                        return (
                          <Pressable
                            key={affirmation.id}
                            style={[
                              styles.affirmationItem,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary + "15"
                                  : colors.surface,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.backgroundTertiary,
                              },
                            ]}
                            onPress={() => handleToggleAffirmation(affirmation.id)}
                          >
                            <View style={styles.affirmationCheckbox}>
                              {isSelected ? (
                                <View style={[styles.checkboxFilled, { backgroundColor: colors.primary }]}>
                                  <Feather name="check" size={14} color={colors.buttonText} />
                                </View>
                              ) : (
                                <View style={[styles.checkboxEmpty, { borderColor: colors.textSecondary }]} />
                              )}
                            </View>
                            <ThemedText
                              style={[
                                styles.affirmationItemText,
                                { color: isSelected ? colors.primary : colors.text },
                              ]}
                              numberOfLines={2}
                            >
                              {affirmation.text}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                  
                  {/* Quick add affirmation */}
                  <View style={[styles.quickAddAffirmation, { borderTopColor: colors.backgroundTertiary }]}>
                    <TextInput
                      style={[
                        styles.quickAddInput,
                        {
                          backgroundColor: colors.surface,
                          color: colors.text,
                          borderColor: colors.backgroundTertiary,
                        },
                      ]}
                      value={newAffirmationText}
                      onChangeText={setNewAffirmationText}
                      placeholder="Add a new affirmation..."
                      placeholderTextColor={colors.textSecondary}
                      returnKeyType="done"
                      onSubmitEditing={handleAddQuickAffirmation}
                      editable={!isAddingAffirmation}
                    />
                    <Pressable
                      style={[
                        styles.quickAddButton,
                        {
                          backgroundColor: newAffirmationText.trim() ? colors.primary : colors.backgroundTertiary,
                        },
                      ]}
                      onPress={handleAddQuickAffirmation}
                      disabled={!newAffirmationText.trim() || isAddingAffirmation}
                    >
                      <Feather 
                        name={isAddingAffirmation ? "loader" : "plus"} 
                        size={20} 
                        color={newAffirmationText.trim() ? colors.buttonText : colors.textSecondary} 
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              <View>
                <ThemedText
                  style={[
                    styles.sectionLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sketch or Draw
                </ThemedText>
                <DrawingCanvas
                  initialPaths={happenings?.drawingPaths || []}
                  onSave={handleSaveDrawing}
                  height={400}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Week Review Modal */}
      <Modal
        visible={showWeekReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWeekReview(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.backgroundDefault }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundTertiary }]}>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Weekly Commitment Review
            </ThemedText>
            <Pressable onPress={() => setShowWeekReview(false)} hitSlop={Spacing.sm}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ padding: Spacing.lg }}
          >
            {renderWeekReview()}
          </ScrollView>
        </View>
      </Modal>

      {/* Month Review Modal */}
      <Modal
        visible={showMonthReview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMonthReview(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.backgroundDefault }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.backgroundTertiary }]}>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Monthly Commitment Review
            </ThemedText>
            <Pressable onPress={() => setShowMonthReview(false)} hitSlop={Spacing.sm}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={{ padding: Spacing.lg }}
          >
            {renderMonthReview()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  totalCard: {
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  balanceSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    ...Typography.largeTitle,
    fontWeight: "700",
  },
  progressContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  compactProgressRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  compactProgressItem: {
    flex: 1,
    alignItems: "center",
  },
  progressLabel: {
    ...Typography.caption,
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  progressPercent: {
    ...Typography.caption,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    width: "100%",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
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
  },
  emptySubtext: {
    ...Typography.small,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: Spacing.minTouchTarget + Spacing.sm,
    height: Spacing.minTouchTarget + Spacing.sm,
    borderRadius: (Spacing.minTouchTarget + Spacing.sm) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  tabText: {
    ...Typography.body,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
  },
  sectionLabel: {
    ...Typography.small,
    marginBottom: Spacing.md,
    fontWeight: "600",
  },
  notesInput: {
    minHeight: 200,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    ...Typography.body,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  confirmDialog: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  confirmTitle: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  confirmMessage: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  confirmButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  affirmationSection: {
    marginTop: Spacing.xl,
  },
  affirmationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  selectedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  selectedBadgeText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  emptyAffirmations: {
    alignItems: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  emptyAffirmationsText: {
    ...Typography.body,
    marginTop: Spacing.sm,
    fontWeight: "500",
  },
  emptyAffirmationsHint: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  affirmationList: {
    gap: Spacing.sm,
  },
  affirmationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  affirmationCheckbox: {
    marginRight: Spacing.md,
  },
  checkboxEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  checkboxFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  affirmationItemText: {
    ...Typography.body,
    flex: 1,
  },
  addAffirmationsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
  },
  quickAddAffirmation: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  quickAddInput: {
    flex: 1,
    ...Typography.body,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  quickAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  dailyBreakdown: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    ...Typography.small,
  },
  breakdownAmount: {
    ...Typography.body,
    fontWeight: "500",
  },
  netRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  netLabel: {
    ...Typography.body,
    fontWeight: "600",
  },
  netAmount: {
    ...Typography.h3,
    fontWeight: "700",
  },
  addMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  addMenu: {
    marginTop: 100,
    marginRight: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    minWidth: 200,
  },
  addMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  addMenuText: {
    ...Typography.body,
    fontWeight: "500",
  },
  addMenuDivider: {
    height: 1,
  },
  realityIncomeSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  realityIncomeSectionTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  realityIncomeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  realityIncomeInfo: {
    flex: 1,
  },
  realityIncomeDescription: {
    ...Typography.body,
  },
  realityIncomeSource: {
    ...Typography.small,
    marginTop: 2,
  },
  realityIncomeAmount: {
    ...Typography.body,
    fontWeight: "600",
    marginRight: Spacing.md,
  },
  realityIncomeDelete: {
    padding: Spacing.xs,
  },
  addAffirmationsButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: Spacing.xs,
  },
  reviewEmptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  reviewEmptyTitle: {
    ...Typography.h4,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  reviewEmptySubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  reviewPeriod: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  dayHeaderRow: {
    flexDirection: "row",
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  eventNameColumn: {
    flex: 1,
    paddingRight: Spacing.sm,
    minWidth: 100,
  },
  eventNameColumnHeader: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  eventNameColumnData: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  daysContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dayColumn: {
    width: 44,
    alignItems: "center",
  },
  dayHeaderText: {
    ...Typography.caption,
  },
  dayHeaderDate: {
    ...Typography.caption,
    marginTop: 2,
  },
  reviewEventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  eventNameWithDot: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: Spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  categoryDotSpacer: {
    width: 8,
    marginRight: Spacing.xs,
  },
  eventNameContent: {
    flex: 1,
  },
  reviewEventName: {
    ...Typography.small,
    fontWeight: "500",
  },
  reviewEventRecurrence: {
    ...Typography.caption,
    textTransform: "capitalize",
  },
  dayCell: {
    height: 28,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  futureDot: {
    ...Typography.caption,
  },
  reviewSummary: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  reviewSummaryTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  summaryEventName: {
    ...Typography.small,
    flex: 1,
    marginRight: Spacing.md,
  },
  summaryStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryCount: {
    ...Typography.small,
    fontWeight: "600",
  },
  reviewSection: {
    marginBottom: Spacing.xl,
  },
  reviewSectionTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  monthlyEventCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  monthlyEventStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  monthlyEventCount: {
    ...Typography.small,
    fontWeight: "500",
  },
  heatMapContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  heatMapHeaderRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  heatMapEventColumn: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  heatMapWeeksContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  heatMapEventHeader: {
    ...Typography.caption,
    fontWeight: "500",
  },
  heatMapWeekColumn: {
    width: 40,
    alignItems: "center",
    marginLeft: 6,
  },
  heatMapWeekLabel: {
    ...Typography.small,
    fontWeight: "500",
    textAlign: "center",
  },
  heatMapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  smallCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
    flexShrink: 0,
  },
  heatMapEventName: {
    ...Typography.body,
    fontSize: 14,
    flexShrink: 1,
  },
  heatMapCell: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  heatMapLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    ...Typography.caption,
  },
});
