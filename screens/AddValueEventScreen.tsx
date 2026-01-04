import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Alert, ScrollView, Pressable, Platform, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { StyledInput } from "@/components/StyledInput";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius, Fonts } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { ValueEvent, ValueEventDefinition, DEFAULT_UNIT_TYPES, ValueEventCategory } from "@/utils/types";
import { calculateEventAmount, formatCurrency } from "@/utils/calculations";

const CATEGORY_COLORS = {
  happiness: "#E8A0BF",
  success: "#7BC96F",
  prosperity: "#5DADE2",
};

const CATEGORY_ICONS: Record<ValueEventCategory, keyof typeof Feather.glyphMap> = {
  happiness: "heart",
  success: "star",
  prosperity: "trending-up",
};

type PickerStep = "category" | "tag" | "event";

interface AddValueEventScreenProps {
  route: {
    params?: {
      event?: ValueEvent;
      date: string;
      defaultPayRate?: number;
    };
  };
  navigation: any;
}

export default function AddValueEventScreen({
  route,
  navigation,
}: AddValueEventScreenProps) {
  const { theme: colors } = useTheme();
  const { event, date, defaultPayRate = 0 } = route.params || { date: "" };
  
  const [definitions, setDefinitions] = useState<ValueEventDefinition[]>([]);
  const [selectedDefinition, setSelectedDefinition] = useState<ValueEventDefinition | null>(null);
  const [showDefinitionPicker, setShowDefinitionPicker] = useState(false);
  const [units, setUnits] = useState(event?.units.toString() || "");
  const [unitType, setUnitType] = useState(event?.unitType || "hours");
  const [payRate, setPayRate] = useState(
    event?.payRate.toString() || defaultPayRate.toString() || ""
  );
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const [pickerStep, setPickerStep] = useState<PickerStep>("category");
  const [selectedCategory, setSelectedCategory] = useState<ValueEventCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDefinitions();
  }, []);

  const loadDefinitions = async () => {
    try {
      const activeData = await storage.getActiveValueEventDefinitions();
      let finalDefinitions = activeData;
      
      if (event?.valueEventDefinitionId) {
        const allData = await storage.getAllValueEventDefinitions();
        const eventDef = allData.find(d => d.id === event.valueEventDefinitionId);
        if (eventDef && !activeData.find(d => d.id === eventDef.id)) {
          finalDefinitions = [eventDef, ...activeData];
        }
        if (eventDef) {
          setSelectedDefinition(eventDef);
        }
      }
      
      setDefinitions(finalDefinitions);
      
      if (!event && finalDefinitions.length > 0) {
        const firstDef = finalDefinitions[0];
        setSelectedDefinition(firstDef);
        setUnits(firstDef.defaultUnits.toString());
        setUnitType(firstDef.unitType);
        const calculatedRate = defaultPayRate * firstDef.payRateMultiplier;
        setPayRate(calculatedRate.toString());
      }
    } catch (error) {
      console.error("Failed to load value event definitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDefinition = (definition: ValueEventDefinition) => {
    setSelectedDefinition(definition);
    setUnits(definition.defaultUnits.toString());
    setUnitType(definition.unitType);
    const calculatedRate = defaultPayRate * definition.payRateMultiplier;
    setPayRate(calculatedRate.toString());
    setShowDefinitionPicker(false);
    setPickerStep("category");
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery("");
  };

  const calculatedAmount = calculateEventAmount(
    parseFloat(units) || 0,
    parseFloat(payRate) || 0
  );

  const handleSave = async () => {
    if (!selectedDefinition) {
      Alert.alert("Required", "Please select a value event to log.");
      return;
    }

    const unitsNum = parseFloat(units);
    const rateNum = parseFloat(payRate);

    if (isNaN(unitsNum) || unitsNum <= 0) {
      Alert.alert("Invalid Units", "Please enter a valid number of units.");
      return;
    }

    if (isNaN(rateNum) || rateNum <= 0) {
      Alert.alert("Invalid Pay Rate", "Please enter a valid pay rate.");
      return;
    }

    const valueEvent: ValueEvent = {
      id: event?.id || Date.now().toString(),
      date: date,
      description: selectedDefinition.name,
      units: unitsNum,
      unitType,
      payRate: rateNum,
      amount: calculatedAmount,
      valueEventDefinitionId: selectedDefinition.id,
    };

    try {
      await storage.saveValueEvent(valueEvent);
      await storage.incrementDefinitionUsage(selectedDefinition.id);
      navigation.goBack();
    } catch (error) {
      console.error("Failed to save value event:", error);
      Alert.alert("Error", "Failed to save value event. Please try again.");
    }
  };

  const isValid = selectedDefinition && parseFloat(units) > 0 && parseFloat(payRate) > 0;

  const categoriesWithCounts = useMemo(() => {
    const counts: Record<ValueEventCategory, number> = {
      happiness: 0,
      success: 0,
      prosperity: 0,
    };
    definitions.forEach(def => {
      counts[def.category]++;
    });
    return counts;
  }, [definitions]);

  const tagsForCategory = useMemo(() => {
    if (!selectedCategory) return { tags: {}, untaggedCount: 0 };
    
    const categoryDefs = definitions.filter(d => d.category === selectedCategory);
    const tagCounts: Record<string, number> = {};
    let untaggedCount = 0;
    
    categoryDefs.forEach(def => {
      const tag = def.tags && def.tags.length > 0 ? def.tags[0] : null;
      if (tag) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      } else {
        untaggedCount++;
      }
    });
    
    return { tags: tagCounts, untaggedCount };
  }, [definitions, selectedCategory]);

  const filteredDefinitions = useMemo(() => {
    let filtered = definitions;
    
    if (selectedCategory) {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }
    
    if (selectedTag !== null) {
      if (selectedTag === "__untagged__") {
        filtered = filtered.filter(d => !d.tags || d.tags.length === 0);
      } else if (selectedTag !== "__all__") {
        filtered = filtered.filter(d => d.tags && d.tags.includes(selectedTag));
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(d => d.name.toLowerCase().includes(query));
    }
    
    return filtered;
  }, [definitions, selectedCategory, selectedTag, searchQuery]);

  const recentDefinitions = useMemo(() => {
    let baseList = definitions;
    
    if (selectedCategory) {
      baseList = baseList.filter(d => d.category === selectedCategory);
    }
    
    if (selectedTag !== null) {
      if (selectedTag === "__untagged__") {
        baseList = baseList.filter(d => !d.tags || d.tags.length === 0);
      } else if (selectedTag !== "__all__") {
        baseList = baseList.filter(d => d.tags && d.tags.includes(selectedTag));
      }
    }
    
    return [...baseList]
      .filter(d => d.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3);
  }, [definitions, selectedCategory, selectedTag]);

  const totalCategoryEvents = selectedCategory ? 
    definitions.filter(d => d.category === selectedCategory).length : 0;

  const handleCategorySelect = (category: ValueEventCategory) => {
    setSelectedCategory(category);
    setPickerStep("tag");
  };

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
    setPickerStep("event");
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setPickerStep("category");
    setSearchQuery("");
  };

  const handleBackToTags = () => {
    setSelectedTag(null);
    setPickerStep("tag");
    setSearchQuery("");
  };

  const openPicker = () => {
    setShowDefinitionPicker(true);
    setPickerStep("category");
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundRoot }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>Loading...</ThemedText>
        </View>
      </View>
    );
  }

  if (definitions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.backgroundRoot }]}>
        <View style={styles.emptyContainer}>
          <Feather name="zap" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
            No Value Events Defined
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Before you can log value events, you need to define them in the Value Events tab.
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Value events are intentional actions you pre-define that support your Happiness, Success, and Prosperity goals.
          </ThemedText>
          <Button
            title="Go to Value Events"
            onPress={() => {
              navigation.goBack();
              navigation.navigate("ValueEventsTab");
            }}
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </View>
    );
  }

  const renderCategoryStep = () => (
    <View style={styles.stepContainer}>
      <ThemedText style={[styles.stepTitle, { color: colors.textSecondary }]}>
        Choose a Category
      </ThemedText>
      
      {(["happiness", "success", "prosperity"] as ValueEventCategory[]).map(category => {
        const count = categoriesWithCounts[category];
        if (count === 0) return null;
        
        return (
          <Pressable
            key={category}
            style={[
              styles.categoryItem,
              { backgroundColor: colors.surface }
            ]}
            onPress={() => handleCategorySelect(category)}
          >
            <View style={styles.categoryLeft}>
              <View style={[styles.categoryDotLarge, { backgroundColor: CATEGORY_COLORS[category] }]}>
                <Feather name={CATEGORY_ICONS[category]} size={16} color="white" />
              </View>
              <ThemedText style={[styles.categoryName, { color: colors.text }]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </ThemedText>
            </View>
            <View style={styles.categoryRight}>
              <ThemedText style={[styles.countBadge, { color: colors.textSecondary }]}>
                {count} {count === 1 ? "event" : "events"}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderTagStep = () => {
    const { tags, untaggedCount } = tagsForCategory;
    const sortedTags = Object.entries(tags).sort((a, b) => a[0].localeCompare(b[0]));
    
    return (
      <View style={styles.stepContainer}>
        <Pressable style={styles.backButton} onPress={handleBackToCategories}>
          <Feather name="chevron-left" size={20} color={colors.primary} />
          <ThemedText style={[styles.backText, { color: colors.primary }]}>
            Categories
          </ThemedText>
        </Pressable>
        
        <View style={styles.currentCategoryBadge}>
          <View style={[styles.categoryDotSmall, { backgroundColor: CATEGORY_COLORS[selectedCategory!] }]} />
          <ThemedText style={[styles.currentCategoryText, { color: colors.text }]}>
            {selectedCategory!.charAt(0).toUpperCase() + selectedCategory!.slice(1)}
          </ThemedText>
        </View>
        
        <ThemedText style={[styles.stepTitle, { color: colors.textSecondary }]}>
          Filter by Tag
        </ThemedText>
        
        <Pressable
          style={[styles.tagItem, styles.showAllItem, { backgroundColor: colors.primary + "15" }]}
          onPress={() => handleTagSelect("__all__")}
        >
          <View style={styles.tagLeft}>
            <Feather name="layers" size={18} color={colors.primary} />
            <ThemedText style={[styles.tagName, { color: colors.primary, fontWeight: "600" }]}>
              Show All
            </ThemedText>
          </View>
          <View style={styles.tagRight}>
            <ThemedText style={[styles.countBadge, { color: colors.primary }]}>
              {totalCategoryEvents}
            </ThemedText>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </View>
        </Pressable>
        
        {sortedTags.map(([tag, count]) => (
          <Pressable
            key={tag}
            style={[styles.tagItem, { backgroundColor: colors.surface }]}
            onPress={() => handleTagSelect(tag)}
          >
            <View style={styles.tagLeft}>
              <Feather name="tag" size={18} color={colors.textSecondary} />
              <ThemedText style={[styles.tagName, { color: colors.text }]}>
                {tag}
              </ThemedText>
            </View>
            <View style={styles.tagRight}>
              <ThemedText style={[styles.countBadge, { color: colors.textSecondary }]}>
                {count}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
        ))}
        
        {untaggedCount > 0 ? (
          <Pressable
            style={[styles.tagItem, { backgroundColor: colors.surface }]}
            onPress={() => handleTagSelect("__untagged__")}
          >
            <View style={styles.tagLeft}>
              <Feather name="minus" size={18} color={colors.textSecondary} />
              <ThemedText style={[styles.tagName, { color: colors.textSecondary, fontStyle: "italic" }]}>
                Untagged
              </ThemedText>
            </View>
            <View style={styles.tagRight}>
              <ThemedText style={[styles.countBadge, { color: colors.textSecondary }]}>
                {untaggedCount}
              </ThemedText>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderEventStep = () => {
    const showingRecent = recentDefinitions.length > 0 && !searchQuery.trim();
    
    return (
      <View style={styles.stepContainer}>
        <Pressable style={styles.backButton} onPress={handleBackToTags}>
          <Feather name="chevron-left" size={20} color={colors.primary} />
          <ThemedText style={[styles.backText, { color: colors.primary }]}>
            Tags
          </ThemedText>
        </Pressable>
        
        <View style={styles.currentCategoryBadge}>
          <View style={[styles.categoryDotSmall, { backgroundColor: CATEGORY_COLORS[selectedCategory!] }]} />
          <ThemedText style={[styles.currentCategoryText, { color: colors.text }]}>
            {selectedCategory!.charAt(0).toUpperCase() + selectedCategory!.slice(1)}
          </ThemedText>
          {selectedTag && selectedTag !== "__all__" ? (
            <>
              <Feather name="chevron-right" size={14} color={colors.textSecondary} style={{ marginHorizontal: 4 }} />
              <ThemedText style={[styles.currentTagText, { color: colors.textSecondary }]}>
                {selectedTag === "__untagged__" ? "Untagged" : selectedTag}
              </ThemedText>
            </>
          ) : null}
        </View>
        
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.backgroundTertiary }]}>
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search events..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        
        {showingRecent ? (
          <View style={styles.recentSection}>
            <ThemedText style={[styles.recentTitle, { color: colors.textSecondary }]}>
              Recently Used
            </ThemedText>
            {recentDefinitions.map(def => (
              <Pressable
                key={`recent-${def.id}`}
                style={[
                  styles.eventItem,
                  { backgroundColor: colors.surface },
                  selectedDefinition?.id === def.id && { backgroundColor: CATEGORY_COLORS[def.category] + "20" }
                ]}
                onPress={() => handleSelectDefinition(def)}
              >
                <View style={styles.eventLeft}>
                  <View style={[styles.categoryDotSmall, { backgroundColor: CATEGORY_COLORS[def.category] }]} />
                  <View style={styles.eventInfo}>
                    <ThemedText 
                      style={[
                        styles.eventName, 
                        { color: selectedDefinition?.id === def.id ? CATEGORY_COLORS[def.category] : colors.text }
                      ]}
                      numberOfLines={1}
                    >
                      {def.name}
                    </ThemedText>
                    <ThemedText style={[styles.eventMeta, { color: colors.textSecondary }]}>
                      {def.defaultUnits} {def.unitType}
                    </ThemedText>
                  </View>
                </View>
                <Feather 
                  name={selectedDefinition?.id === def.id ? "check-circle" : "circle"} 
                  size={20} 
                  color={selectedDefinition?.id === def.id ? CATEGORY_COLORS[def.category] : colors.textSecondary} 
                />
              </Pressable>
            ))}
          </View>
        ) : null}
        
        <ThemedText style={[styles.stepTitle, { color: colors.textSecondary, marginTop: showingRecent ? Spacing.lg : 0 }]}>
          {searchQuery.trim() ? `Results (${filteredDefinitions.length})` : "All Events"}
        </ThemedText>
        
        {filteredDefinitions.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Feather name="search" size={32} color={colors.textSecondary} />
            <ThemedText style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No events found
            </ThemedText>
          </View>
        ) : (
          filteredDefinitions.map(def => (
            <Pressable
              key={def.id}
              style={[
                styles.eventItem,
                { backgroundColor: colors.surface },
                selectedDefinition?.id === def.id && { backgroundColor: CATEGORY_COLORS[def.category] + "20" }
              ]}
              onPress={() => handleSelectDefinition(def)}
            >
              <View style={styles.eventLeft}>
                <View style={[styles.categoryDotSmall, { backgroundColor: CATEGORY_COLORS[def.category] }]} />
                <View style={styles.eventInfo}>
                  <ThemedText 
                    style={[
                      styles.eventName, 
                      { color: selectedDefinition?.id === def.id ? CATEGORY_COLORS[def.category] : colors.text }
                    ]}
                    numberOfLines={1}
                  >
                    {def.name}
                  </ThemedText>
                  <ThemedText style={[styles.eventMeta, { color: colors.textSecondary }]}>
                    {def.defaultUnits} {def.unitType} {def.tags && def.tags[0] ? `\u2022 ${def.tags[0]}` : ""}
                  </ThemedText>
                </View>
              </View>
              <Feather 
                name={selectedDefinition?.id === def.id ? "check-circle" : "circle"} 
                size={20} 
                color={selectedDefinition?.id === def.id ? CATEGORY_COLORS[def.category] : colors.textSecondary} 
              />
            </Pressable>
          ))
        )}
      </View>
    );
  };

  const renderPicker = () => {
    switch (pickerStep) {
      case "category":
        return renderCategoryStep();
      case "tag":
        return renderTagStep();
      case "event":
        return renderEventStep();
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundRoot }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.helperCard, { backgroundColor: colors.backgroundSecondary }]}>
        <Feather name="info" size={16} color={colors.textSecondary} />
        <ThemedText style={[styles.helperText, { color: colors.textSecondary }]}>
          Select the Value Event you completed today.
        </ThemedText>
      </View>

      <ThemedText style={[styles.label, { color: colors.text }]}>
        Value Event
      </ThemedText>
      <Pressable
        style={[
          styles.definitionPickerButton,
          {
            backgroundColor: colors.surface,
            borderColor: selectedDefinition 
              ? CATEGORY_COLORS[selectedDefinition.category]
              : colors.backgroundTertiary,
          },
        ]}
        onPress={() => showDefinitionPicker ? setShowDefinitionPicker(false) : openPicker()}
      >
        {selectedDefinition ? (
          <View style={styles.selectedDefinition}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: CATEGORY_COLORS[selectedDefinition.category] },
              ]}
            />
            <ThemedText style={[styles.selectedName, { color: colors.text }]}>
              {selectedDefinition.name}
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={{ color: colors.textSecondary }}>
            Select a value event...
          </ThemedText>
        )}
        <Feather
          name={showDefinitionPicker ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {showDefinitionPicker ? (
        <View
          style={[
            styles.definitionPickerContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          {renderPicker()}
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <StyledInput
            label="Units/Time"
            value={units}
            onChangeText={setUnits}
            keyboardType="decimal-pad"
            placeholder="1.5"
          />
        </View>
        <View style={styles.halfWidth}>
          <ThemedText style={[styles.label, { color: colors.text }]}>
            Unit Type
          </ThemedText>
          <Pressable
            style={[
              styles.unitPickerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.backgroundTertiary,
              },
            ]}
            onPress={() => setShowUnitPicker(!showUnitPicker)}
          >
            <ThemedText style={{ color: colors.text }}>{unitType}</ThemedText>
            <Feather
              name={showUnitPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {showUnitPicker ? (
        <View
          style={[
            styles.unitPickerContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          {DEFAULT_UNIT_TYPES.map((type) => (
            <Pressable
              key={type}
              style={styles.unitPickerItem}
              onPress={() => {
                setUnitType(type);
                setShowUnitPicker(false);
              }}
            >
              <ThemedText
                style={[
                  styles.unitPickerText,
                  {
                    color:
                      type === unitType ? colors.primary : colors.text,
                    fontWeight: type === unitType ? "600" : "400",
                  },
                ]}
              >
                {type}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      <StyledInput
        label="Pay Rate"
        value={payRate}
        onChangeText={setPayRate}
        keyboardType="decimal-pad"
        placeholder="50"
        leftIcon={
          <ThemedText style={{ color: colors.textSecondary }}>$</ThemedText>
        }
      />

      <View
        style={[
          styles.calculatedCard,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <ThemedText style={[styles.calculatedLabel, { color: colors.textSecondary }]}>
          Calculated Amount
        </ThemedText>
        <ThemedText
          style={[
            styles.calculatedAmount,
            { color: colors.positive, fontFamily: Fonts?.mono || "monospace" },
          ]}
        >
          {formatCurrency(calculatedAmount)}
        </ThemedText>
      </View>

      <Button
        title={event ? "Update Entry" : "Log Value Event"}
        onPress={handleSave}
        disabled={!isValid}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing["2xl"],
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
  },
  emptyTitle: {
    ...Typography.h4,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.body,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  emptyHint: {
    ...Typography.small,
    marginTop: Spacing.lg,
    textAlign: "center",
    fontStyle: "italic",
  },
  helperCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  helperText: {
    ...Typography.small,
    flex: 1,
  },
  label: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  definitionPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    minHeight: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  selectedDefinition: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  categoryDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  categoryDotLarge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedName: {
    ...Typography.body,
    fontWeight: "500",
  },
  definitionPickerContainer: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.md,
    overflow: "hidden",
  },
  stepContainer: {
    padding: Spacing.md,
  },
  stepTitle: {
    ...Typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryName: {
    ...Typography.body,
    fontWeight: "600",
  },
  countBadge: {
    ...Typography.caption,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  backText: {
    ...Typography.body,
    fontWeight: "500",
  },
  currentCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  currentCategoryText: {
    ...Typography.body,
    fontWeight: "500",
  },
  currentTagText: {
    ...Typography.small,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  showAllItem: {
    marginBottom: Spacing.md,
  },
  tagLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tagRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  tagName: {
    ...Typography.body,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    height: "100%",
  },
  recentSection: {
    marginBottom: Spacing.md,
  },
  recentTitle: {
    ...Typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  eventLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    ...Typography.body,
  },
  eventMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  noResultsContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  noResultsText: {
    ...Typography.body,
    marginTop: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfWidth: {
    flex: 1,
  },
  unitPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    minHeight: Spacing.inputHeight,
    paddingHorizontal: Spacing.md,
  },
  unitPickerContainer: {
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    maxHeight: 200,
  },
  unitPickerItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  unitPickerText: {
    ...Typography.body,
  },
  calculatedCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  calculatedLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  calculatedAmount: {
    ...Typography.largeTitle,
    fontWeight: "700",
  },
});
