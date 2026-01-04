import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Platform,
  TextInput,
} from "react-native";

const VALUE_EVENTS_GUIDANCE = `What are Value Events?

Value Events are the specific actions that move you toward your goals. They are the behaviors your subconscious is being trained to reward.

These are not random tasks. They are intentionally chosen actions that represent progress in:

• Happiness
• Success
• Prosperity

You define these events in advance so your mind learns what "success" looks like in real, repeatable form.

Each day, you are paid mental income for completing these actions — reinforcing momentum and building belief through evidence, not emotion.

Best Practice
Choose Value Events that feel:
• Meaningful
• Achievable
• Slightly stretching, but believable

You may revise your list over time as your focus evolves. The power lies in consistency and clarity.

Value Events are the engine of your Mental Bank.`;
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyledInput } from "@/components/StyledInput";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import {
  Spacing,
  Typography,
  BorderRadius,
  Fonts,
} from "@/constants/theme";
import { storage } from "@/utils/storage";
import { ValueEventDefinition, ValueEventCategory, ValueEventRecurrence, DEFAULT_UNIT_TYPES, RECURRENCE_OPTIONS } from "@/utils/types";

const CATEGORIES: { id: ValueEventCategory; label: string; icon: string }[] = [
  { id: "happiness", label: "Happiness", icon: "heart" },
  { id: "success", label: "Success", icon: "award" },
  { id: "prosperity", label: "Prosperity", icon: "trending-up" },
];

const CATEGORY_COLORS = {
  happiness: "#E8A0BF",
  success: "#7BC96F",
  prosperity: "#5DADE2",
};

export default function ValueEventsScreen() {
  const { theme: colors } = useTheme();
  const insets = useScreenInsets({ transparentHeader: false });
  
  const [definitions, setDefinitions] = useState<ValueEventDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<ValueEventDefinition | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<ValueEventCategory>>(
    new Set()
  );
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState<ValueEventCategory>("happiness");
  const [formDefaultUnits, setFormDefaultUnits] = useState("1");
  const [formUnitType, setFormUnitType] = useState("hours");
  const [formPayRateMultiplier, setFormPayRateMultiplier] = useState("1");
  const [formTag, setFormTag] = useState<string | undefined>(undefined);
  const [newTagInput, setNewTagInput] = useState("");
  const [formRecurrence, setFormRecurrence] = useState<ValueEventRecurrence>("weekly");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);

  const getExistingTags = (category: ValueEventCategory): string[] => {
    const tags = definitions
      .filter((d) => d.category === category && d.tags && d.tags.length > 0)
      .flatMap((d) => d.tags || []);
    return [...new Set(tags)].sort();
  };

  useFocusEffect(
    useCallback(() => {
      loadDefinitions();
    }, [])
  );

  const loadDefinitions = async () => {
    try {
      const data = await storage.getAllValueEventDefinitions();
      setDefinitions(data);
    } catch (error) {
      console.error("Failed to load value event definitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormCategory("happiness");
    setFormDefaultUnits("1");
    setFormUnitType("hours");
    setFormPayRateMultiplier("1");
    setFormTag(undefined);
    setNewTagInput("");
    setFormRecurrence("weekly");
    setEditingDefinition(null);
  };

  const openAddModal = (category?: ValueEventCategory) => {
    resetForm();
    if (category) {
      setFormCategory(category);
    }
    setShowAddModal(true);
  };

  const openEditModal = (definition: ValueEventDefinition) => {
    setEditingDefinition(definition);
    setFormName(definition.name);
    setFormDescription(definition.description || "");
    setFormCategory(definition.category);
    setFormDefaultUnits(definition.defaultUnits.toString());
    setFormUnitType(definition.unitType);
    setFormPayRateMultiplier(definition.payRateMultiplier.toString());
    setFormTag(definition.tags?.[0] || undefined);
    setNewTagInput("");
    setFormRecurrence(definition.recurrence || "weekly");
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert("Required", "Please enter a name for this value event.");
      return;
    }

    const finalTag = newTagInput.trim() || formTag;
    const definition: ValueEventDefinition = {
      id: editingDefinition?.id || Date.now().toString(),
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      defaultUnits: parseFloat(formDefaultUnits) || 1,
      unitType: formUnitType,
      payRateMultiplier: parseFloat(formPayRateMultiplier) || 1,
      isActive: editingDefinition?.isActive ?? true,
      createdAt: editingDefinition?.createdAt || new Date().toISOString(),
      usageCount: editingDefinition?.usageCount || 0,
      tags: finalTag ? [finalTag] : undefined,
      recurrence: formRecurrence,
    };

    try {
      await storage.saveValueEventDefinition(definition);
      setShowAddModal(false);
      resetForm();
      loadDefinitions();
    } catch (error) {
      console.error("Failed to save value event definition:", error);
      Alert.alert("Error", "Failed to save. Please try again.");
    }
  };

  const handleDelete = (definition: ValueEventDefinition) => {
    const confirmDelete = () => {
      storage.deleteValueEventDefinition(definition.id).then(() => {
        loadDefinitions();
      });
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${definition.name}"? This cannot be undone.`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Value Event",
        `Delete "${definition.name}"? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  const toggleActive = async (definition: ValueEventDefinition) => {
    const updated = { ...definition, isActive: !definition.isActive };
    await storage.saveValueEventDefinition(updated);
    loadDefinitions();
  };

  const toggleCategory = (category: ValueEventCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleTag = (categoryId: string, tag: string) => {
    const key = `${categoryId}:${tag}`;
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedTags(newExpanded);
  };

  const getCategoryEvents = (category: ValueEventCategory) =>
    definitions.filter((d) => d.category === category);

  const getTagsInCategory = (category: ValueEventCategory): string[] => {
    const events = getCategoryEvents(category);
    const tags = events
      .filter((d) => d.tags && d.tags.length > 0)
      .flatMap((d) => d.tags || []);
    return [...new Set(tags)].sort();
  };

  const getEventsByTag = (category: ValueEventCategory, tag: string | null) => {
    const events = getCategoryEvents(category);
    if (tag === null) {
      return events.filter((d) => !d.tags || d.tags.length === 0);
    }
    return events.filter((d) => d.tags && d.tags.includes(tag));
  };

  const categoryHasTags = (category: ValueEventCategory): boolean => {
    const events = getCategoryEvents(category);
    return events.some((d) => d.tags && d.tags.length > 0);
  };

  const renderDefinitionItem = ({ item }: { item: ValueEventDefinition }) => (
    <Pressable
      style={[
        styles.definitionCard,
        { 
          backgroundColor: colors.surface,
          opacity: item.isActive ? 1 : 0.6,
        },
      ]}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.definitionHeader}>
        <View style={styles.definitionTitleRow}>
          <View
            style={[
              styles.categoryDot,
              { backgroundColor: CATEGORY_COLORS[item.category] },
            ]}
          />
          <ThemedText style={[styles.definitionName, { color: colors.text }]}>
            {item.name}
          </ThemedText>
        </View>
        <View style={styles.definitionActions}>
          <Pressable
            onPress={() => toggleActive(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionButton}
          >
            <Feather
              name={item.isActive ? "eye" : "eye-off"}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.actionButton}
          >
            <Feather name="trash-2" size={18} color="#E57373" />
          </Pressable>
        </View>
      </View>
      {item.description ? (
        <ThemedText
          style={[styles.definitionDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.description}
        </ThemedText>
      ) : null}
      <View style={styles.definitionMeta}>
        <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
          {item.defaultUnits} {item.unitType}
        </ThemedText>
        <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
          {item.payRateMultiplier}x rate
        </ThemedText>
        <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
          Used {item.usageCount}x
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.headerRow, { paddingTop: insets.paddingTop }]}>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          Value Events
        </ThemedText>
        <Pressable
          style={[styles.infoButton, { backgroundColor: colors.primary + "20" }]}
          onPress={() => setShowGuidance(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="help-circle" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item: category }) => {
          const categoryEvents = getCategoryEvents(category.id);
          const isExpanded = expandedCategories.has(category.id);
          return (
            <View key={category.id} style={styles.categorySection}>
              <Pressable
                style={[
                  styles.categoryHeader,
                  { backgroundColor: CATEGORY_COLORS[category.id] + "15" },
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={styles.categoryHeaderLeft}>
                  <Feather
                    name={category.icon as any}
                    size={20}
                    color={CATEGORY_COLORS[category.id]}
                  />
                  <ThemedText
                    style={[
                      styles.categoryHeaderTitle,
                      { color: CATEGORY_COLORS[category.id] },
                    ]}
                  >
                    {category.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.categoryCount,
                      { color: CATEGORY_COLORS[category.id] },
                    ]}
                  >
                    ({categoryEvents.length})
                  </ThemedText>
                </View>
                <Feather
                  name={isExpanded ? "chevron-down" : "chevron-right"}
                  size={20}
                  color={CATEGORY_COLORS[category.id]}
                />
              </Pressable>
              {isExpanded && (
                <View style={styles.categoryContent}>
                  {categoryEvents.length === 0 ? (
                    <View style={styles.emptyCategory}>
                      <ThemedText
                        style={[styles.emptyCategoryText, { color: colors.textSecondary }]}
                      >
                        No {category.label.toLowerCase()} events defined
                      </ThemedText>
                    </View>
                  ) : categoryHasTags(category.id) ? (
                    <>
                      {getTagsInCategory(category.id).map((tag) => {
                        const tagKey = `${category.id}:${tag}`;
                        const isTagExpanded = expandedTags.has(tagKey);
                        const tagEvents = getEventsByTag(category.id, tag);
                        return (
                          <View key={tag} style={styles.tagGroup}>
                            <Pressable
                              style={[
                                styles.tagHeader,
                                { backgroundColor: colors.backgroundSecondary },
                              ]}
                              onPress={() => toggleTag(category.id, tag)}
                            >
                              <View style={styles.tagHeaderLeft}>
                                <Feather
                                  name="tag"
                                  size={14}
                                  color={colors.textSecondary}
                                />
                                <ThemedText
                                  style={[styles.tagHeaderTitle, { color: colors.text }]}
                                >
                                  {tag}
                                </ThemedText>
                                <ThemedText
                                  style={[styles.tagHeaderCount, { color: colors.textSecondary }]}
                                >
                                  ({tagEvents.length})
                                </ThemedText>
                              </View>
                              <Feather
                                name={isTagExpanded ? "chevron-down" : "chevron-right"}
                                size={16}
                                color={colors.textSecondary}
                              />
                            </Pressable>
                            {isTagExpanded && (
                              <View style={styles.tagContent}>
                                {tagEvents.map((item) => (
                                  <View key={item.id}>{renderDefinitionItem({ item })}</View>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                      {getEventsByTag(category.id, null).length > 0 && (
                        <View style={styles.tagGroup}>
                          <Pressable
                            style={[
                              styles.tagHeader,
                              { backgroundColor: colors.backgroundSecondary },
                            ]}
                            onPress={() => toggleTag(category.id, "__untagged__")}
                          >
                            <View style={styles.tagHeaderLeft}>
                              <Feather
                                name="minus-circle"
                                size={14}
                                color={colors.textSecondary}
                              />
                              <ThemedText
                                style={[styles.tagHeaderTitle, { color: colors.textSecondary }]}
                              >
                                Untagged
                              </ThemedText>
                              <ThemedText
                                style={[styles.tagHeaderCount, { color: colors.textSecondary }]}
                              >
                                ({getEventsByTag(category.id, null).length})
                              </ThemedText>
                            </View>
                            <Feather
                              name={expandedTags.has(`${category.id}:__untagged__`) ? "chevron-down" : "chevron-right"}
                              size={16}
                              color={colors.textSecondary}
                            />
                          </Pressable>
                          {expandedTags.has(`${category.id}:__untagged__`) && (
                            <View style={styles.tagContent}>
                              {getEventsByTag(category.id, null).map((item) => (
                                <View key={item.id}>{renderDefinitionItem({ item })}</View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  ) : (
                    categoryEvents.map((item) => (
                      <View key={item.id}>{renderDefinitionItem({ item })}</View>
                    ))
                  )}
                  <Pressable
                    style={[
                      styles.addCategoryButton,
                      { borderColor: CATEGORY_COLORS[category.id] },
                    ]}
                    onPress={() => openAddModal(category.id)}
                  >
                    <Feather
                      name="plus"
                      size={18}
                      color={CATEGORY_COLORS[category.id]}
                    />
                    <ThemedText
                      style={[
                        styles.addCategoryButtonText,
                        { color: CATEGORY_COLORS[category.id] },
                      ]}
                    >
                      Add {category.label} Event
                    </ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.paddingBottom + 20 },
        ]}
      />

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                {editingDefinition ? "Edit Value Event" : "Define Value Event"}
              </ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText
                style={[styles.helperText, { color: colors.textSecondary }]}
              >
                Define an intentional action that supports your goals. You'll log these during your daily Mental Bank practice.
              </ThemedText>

              <StyledInput
                label="Event Name"
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g., Morning meditation, Client call"
                maxLength={100}
              />

              <StyledInput
                label="Description (optional)"
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="What does this event represent?"
                multiline
                maxLength={200}
              />

              <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                Category
              </ThemedText>
              <View style={styles.categorySelector}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categorySelectorItem,
                      {
                        backgroundColor:
                          formCategory === cat.id
                            ? CATEGORY_COLORS[cat.id] + "30"
                            : colors.surface,
                        borderColor:
                          formCategory === cat.id
                            ? CATEGORY_COLORS[cat.id]
                            : colors.backgroundTertiary,
                      },
                    ]}
                    onPress={() => setFormCategory(cat.id)}
                  >
                    <Feather
                      name={cat.icon as any}
                      size={16}
                      color={
                        formCategory === cat.id
                          ? CATEGORY_COLORS[cat.id]
                          : colors.textSecondary
                      }
                    />
                    <ThemedText
                      style={[
                        styles.categorySelectorLabel,
                        {
                          color:
                            formCategory === cat.id
                              ? CATEGORY_COLORS[cat.id]
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {cat.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                Tag (optional)
              </ThemedText>
              <View style={[styles.tagSection, { backgroundColor: colors.surface, borderColor: colors.backgroundTertiary }]}>
                {getExistingTags(formCategory).length > 0 ? (
                  <>
                    {getExistingTags(formCategory).map((tag) => (
                      <Pressable
                        key={tag}
                        style={[
                          styles.tagOption,
                          {
                            backgroundColor: formTag === tag && !newTagInput ? colors.primary + "20" : "transparent",
                            borderColor: formTag === tag && !newTagInput ? colors.primary : colors.backgroundTertiary,
                          },
                        ]}
                        onPress={() => {
                          setFormTag(tag);
                          setNewTagInput("");
                        }}
                      >
                        <Feather
                          name={formTag === tag && !newTagInput ? "check-circle" : "circle"}
                          size={16}
                          color={formTag === tag && !newTagInput ? colors.primary : colors.textSecondary}
                        />
                        <ThemedText
                          style={[
                            styles.tagOptionText,
                            { color: formTag === tag && !newTagInput ? colors.primary : colors.text },
                          ]}
                        >
                          {tag}
                        </ThemedText>
                      </Pressable>
                    ))}
                    <Pressable
                      style={[
                        styles.tagOption,
                        {
                          backgroundColor: !formTag && !newTagInput ? colors.primary + "20" : "transparent",
                          borderColor: !formTag && !newTagInput ? colors.primary : colors.backgroundTertiary,
                        },
                      ]}
                      onPress={() => {
                        setFormTag(undefined);
                        setNewTagInput("");
                      }}
                    >
                      <Feather
                        name={!formTag && !newTagInput ? "check-circle" : "circle"}
                        size={16}
                        color={!formTag && !newTagInput ? colors.primary : colors.textSecondary}
                      />
                      <ThemedText
                        style={[
                          styles.tagOptionText,
                          { color: !formTag && !newTagInput ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        No tag
                      </ThemedText>
                    </Pressable>
                    <View style={[styles.tagDivider, { backgroundColor: colors.backgroundTertiary }]} />
                  </>
                ) : null}
                <View style={[styles.newTagRow, { backgroundColor: colors.surface, borderColor: colors.backgroundTertiary }]}>
                  <Feather name="plus" size={16} color={colors.textSecondary} />
                  <TextInput
                    placeholder="Create new tag..."
                    placeholderTextColor={colors.textSecondary}
                    value={newTagInput}
                    onChangeText={(text) => {
                      setNewTagInput(text);
                      if (text.trim()) {
                        setFormTag(undefined);
                      }
                    }}
                    style={[styles.newTagInput, { color: colors.text }]}
                  />
                </View>
              </View>

              <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
                Recurrence
              </ThemedText>
              <View style={styles.recurrenceSelector}>
                {RECURRENCE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.recurrenceOption,
                      {
                        backgroundColor:
                          formRecurrence === option.id
                            ? colors.primary + "20"
                            : colors.surface,
                        borderColor:
                          formRecurrence === option.id
                            ? colors.primary
                            : colors.backgroundTertiary,
                      },
                    ]}
                    onPress={() => setFormRecurrence(option.id)}
                  >
                    <Feather
                      name={option.icon as any}
                      size={16}
                      color={
                        formRecurrence === option.id
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <ThemedText
                      style={[
                        styles.recurrenceLabel,
                        {
                          color:
                            formRecurrence === option.id
                              ? colors.primary
                              : colors.textSecondary,
                        },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <StyledInput
                    label="Default Units"
                    value={formDefaultUnits}
                    onChangeText={setFormDefaultUnits}
                    keyboardType="decimal-pad"
                    placeholder="1"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <ThemedText style={[styles.inputLabel, { color: colors.text }]}>
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
                    <ThemedText style={{ color: colors.text }}>
                      {formUnitType}
                    </ThemedText>
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
                        setFormUnitType(type);
                        setShowUnitPicker(false);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.unitPickerText,
                          {
                            color: type === formUnitType ? colors.primary : colors.text,
                            fontWeight: type === formUnitType ? "600" : "400",
                          },
                        ]}
                      >
                        {type}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <View>
                <StyledInput
                  label="Pay Rate Multiplier"
                  value={formPayRateMultiplier}
                  onChangeText={setFormPayRateMultiplier}
                  keyboardType="decimal-pad"
                  placeholder="1"
                />
                <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
                  Multiply your base pay rate (e.g., 1.5x for high-value tasks)
                </ThemedText>
              </View>

              <Button
                title={editingDefinition ? "Save Changes" : "Add Value Event"}
                onPress={handleSave}
                style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showGuidance}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuidance(false)}
      >
        <View style={styles.guidanceOverlay}>
          <Pressable
            style={styles.guidanceBackdrop}
            onPress={() => setShowGuidance(false)}
          />
          <View
            style={[styles.guidanceContent, { backgroundColor: colors.backgroundDefault }]}
          >
            <View style={styles.guidanceHeader}>
              <View style={[styles.guidanceIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="zap" size={24} color={colors.primary} />
              </View>
              <Pressable
                onPress={() => setShowGuidance(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.guidanceScroll}
              contentContainerStyle={styles.guidanceScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <ThemedText style={[styles.guidanceText, { color: colors.text }]}>
                {VALUE_EVENTS_GUIDANCE}
              </ThemedText>
            </ScrollView>
            <Button
              title="Got it"
              onPress={() => setShowGuidance(false)}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryTabs: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  categoryTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryLabel: {
    ...Typography.small,
    fontWeight: "600",
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  definitionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  definitionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  definitionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  definitionName: {
    ...Typography.body,
    fontWeight: "600",
    flex: 1,
  },
  definitionActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  definitionDescription: {
    ...Typography.small,
    marginTop: Spacing.xs,
    marginLeft: Spacing.md + 8,
  },
  definitionMeta: {
    flexDirection: "row",
    marginTop: Spacing.sm,
    marginLeft: Spacing.md + 8,
    gap: Spacing.lg,
  },
  metaText: {
    ...Typography.caption,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    paddingHorizontal: Spacing.xl,
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
  fab: {
    position: "absolute",
    right: Spacing.xl,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    ...Typography.h4,
    fontWeight: "600",
  },
  modalScroll: {
    padding: Spacing.lg,
  },
  helperText: {
    ...Typography.small,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  inputLabel: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  categorySelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categorySelectorItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  categorySelectorLabel: {
    ...Typography.caption,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
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
    marginBottom: Spacing.lg,
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
  hintText: {
    ...Typography.caption,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
  },
  guidanceOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  guidanceBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  guidanceContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    maxWidth: 500,
    width: "100%",
    maxHeight: "80%",
  },
  guidanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  guidanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  guidanceScroll: {
    marginBottom: Spacing.lg,
    maxHeight: 350,
  },
  guidanceScrollContent: {
    paddingBottom: Spacing.sm,
  },
  guidanceText: {
    ...Typography.body,
    lineHeight: 24,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: "600",
    flex: 1,
  },
  categorySection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  categoryHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  categoryHeaderTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  categoryCount: {
    ...Typography.caption,
    fontWeight: "500",
  },
  categoryContent: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  emptyCategory: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  emptyCategoryText: {
    ...Typography.body,
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BorderRadius.sm,
  },
  addCategoryButtonText: {
    ...Typography.caption,
    fontWeight: "500",
  },
  tagSection: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tagOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  tagOptionText: {
    ...Typography.body,
  },
  tagDivider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  newTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    minHeight: Spacing.inputHeight,
  },
  newTagInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.xs,
  },
  tagGroup: {
    marginBottom: Spacing.xs,
  },
  tagHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  tagHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  tagHeaderTitle: {
    ...Typography.body,
    fontWeight: "500",
  },
  tagHeaderCount: {
    ...Typography.caption,
  },
  tagContent: {
    paddingLeft: Spacing.md,
  },
  recurrenceSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  recurrenceOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  recurrenceLabel: {
    ...Typography.caption,
    fontWeight: "500",
  },
});
