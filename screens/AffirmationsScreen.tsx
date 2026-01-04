import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { Spacing, Typography, BorderRadius, Shadows } from "@/constants/theme";
import { storage } from "@/utils/storage";
import { Affirmation } from "@/utils/types";

const CATEGORIES = [
  { id: "general", label: "General", color: "#6B7280" },
  { id: "happiness", label: "Happiness", color: "#F59E0B" },
  { id: "success", label: "Success", color: "#10B981" },
  { id: "prosperity", label: "Prosperity", color: "#8B5CF6" },
] as const;

const EXAMPLE_AFFIRMATIONS = [
  "I am open to receiving abundance in all forms",
  "My efforts lead me toward greater success each day",
  "I attract positive opportunities into my life",
  "I am worthy of happiness and fulfillment",
  "I am creating the life I desire",
  "Every day I move closer to my goals",
];

export default function AffirmationsScreen() {
  const { theme: colors } = useTheme();
  const insets = useScreenInsets({ transparentHeader: false });

  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newAffirmationText, setNewAffirmationText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Affirmation["category"]>("general");
  const [editingAffirmation, setEditingAffirmation] = useState<Affirmation | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAffirmations();
    }, [])
  );

  const loadAffirmations = async () => {
    try {
      const data = await storage.getAllAffirmations();
      setAffirmations(data.sort((a, b) => b.usageCount - a.usageCount));
    } catch (error) {
      console.error("Failed to load affirmations:", error);
    }
  };

  const handleSaveAffirmation = async () => {
    if (!newAffirmationText.trim()) return;

    try {
      const affirmation: Affirmation = editingAffirmation
        ? {
            ...editingAffirmation,
            text: newAffirmationText.trim(),
            category: selectedCategory,
          }
        : {
            id: Date.now().toString(),
            text: newAffirmationText.trim(),
            category: selectedCategory,
            createdAt: new Date().toISOString(),
            usageCount: 0,
          };

      await storage.saveAffirmation(affirmation);
      await loadAffirmations();
      resetModal();
    } catch (error) {
      console.error("Failed to save affirmation:", error);
    }
  };

  const handleDeleteAffirmation = async () => {
    if (!showDeleteConfirm) return;
    try {
      await storage.deleteAffirmation(showDeleteConfirm);
      await loadAffirmations();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete affirmation:", error);
    }
  };

  const handleEditAffirmation = (affirmation: Affirmation) => {
    setEditingAffirmation(affirmation);
    setNewAffirmationText(affirmation.text);
    setSelectedCategory(affirmation.category || "general");
    setShowAddModal(true);
  };

  const handleAddExample = (text: string) => {
    setNewAffirmationText(text);
    setSelectedCategory("general");
    setShowAddModal(true);
  };

  const resetModal = () => {
    setShowAddModal(false);
    setNewAffirmationText("");
    setSelectedCategory("general");
    setEditingAffirmation(null);
  };

  const getCategoryColor = (category: Affirmation["category"]) => {
    return CATEGORIES.find((c) => c.id === category)?.color || colors.textSecondary;
  };

  const renderAffirmation = ({ item }: { item: Affirmation }) => (
    <Pressable
      style={[styles.affirmationCard, { backgroundColor: colors.surface }]}
      onPress={() => handleEditAffirmation(item)}
    >
      <View style={styles.affirmationContent}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(item.category) + "20" },
          ]}
        >
          <ThemedText
            style={[styles.categoryText, { color: getCategoryColor(item.category) }]}
          >
            {CATEGORIES.find((c) => c.id === item.category)?.label || "General"}
          </ThemedText>
        </View>
        <ThemedText style={[styles.affirmationText, { color: colors.text }]}>
          {item.text}
        </ThemedText>
        <ThemedText style={[styles.usageText, { color: colors.textSecondary }]}>
          Used {item.usageCount} {item.usageCount === 1 ? "time" : "times"}
        </ThemedText>
      </View>
      <Pressable
        style={styles.deleteButton}
        onPress={() => setShowDeleteConfirm(item.id)}
        hitSlop={Spacing.md}
      >
        <Feather name="trash-2" size={18} color={colors.danger} />
      </Pressable>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="heart" size={48} color={colors.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
        No Affirmations Yet
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
        Add affirmations to strengthen your Mental Bank practice
      </ThemedText>

      <ThemedText style={[styles.examplesTitle, { color: colors.text }]}>
        Get Started with Examples
      </ThemedText>
      {EXAMPLE_AFFIRMATIONS.slice(0, 3).map((text, index) => (
        <Pressable
          key={index}
          style={[styles.exampleCard, { backgroundColor: colors.surface }]}
          onPress={() => handleAddExample(text)}
        >
          <ThemedText style={[styles.exampleText, { color: colors.text }]}>
            "{text}"
          </ThemedText>
          <Feather name="plus" size={18} color={colors.primary} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundRoot }]}>
      <FlatList
        data={affirmations}
        renderItem={renderAffirmation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.minTouchTarget + Spacing.lg },
        ]}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={
          affirmations.length > 0 ? (
            <ThemedText style={[styles.headerText, { color: colors.textSecondary }]}>
              Tap an affirmation to edit, or add new ones with the + button
            </ThemedText>
          ) : null
        }
      />

      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + Spacing.lg,
            ...Shadows.floating,
          },
        ]}
        onPress={() => setShowAddModal(true)}
        testID="add-affirmation-button"
      >
        <Feather name="plus" size={24} color={colors.buttonText} />
      </Pressable>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={Keyboard.dismiss}
          >
            <Pressable 
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <ThemedText style={styles.modalTitle}>
                  {editingAffirmation ? "Edit Affirmation" : "New Affirmation"}
                </ThemedText>

                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Your Affirmation
                </ThemedText>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.backgroundTertiary,
                    },
                  ]}
                  value={newAffirmationText}
                  onChangeText={setNewAffirmationText}
                  placeholder="I am open to receiving abundance..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                  testID="affirmation-text-input"
                />

                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Category
                </ThemedText>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        {
                          backgroundColor:
                            selectedCategory === cat.id ? cat.color : colors.backgroundSecondary,
                        },
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setSelectedCategory(cat.id as Affirmation["category"]);
                      }}
                    >
                      <ThemedText
                        style={[
                          styles.categoryOptionText,
                          { color: selectedCategory === cat.id ? "#fff" : colors.text },
                        ]}
                      >
                        {cat.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                {!editingAffirmation ? (
                  <View style={styles.suggestionsSection}>
                    <ThemedText style={[styles.suggestionsTitle, { color: colors.textSecondary }]}>
                      Suggestions
                    </ThemedText>
                    <View style={styles.suggestionsRow}>
                      {EXAMPLE_AFFIRMATIONS.slice(0, 2).map((text, index) => (
                        <Pressable
                          key={index}
                          style={[styles.suggestionChip, { backgroundColor: colors.backgroundSecondary }]}
                          onPress={() => {
                            Keyboard.dismiss();
                            setNewAffirmationText(text);
                          }}
                        >
                          <ThemedText
                            style={[styles.suggestionText, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {text}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={resetModal}
                  >
                    <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: newAffirmationText.trim()
                          ? colors.primary
                          : colors.backgroundTertiary,
                      },
                    ]}
                    onPress={handleSaveAffirmation}
                    disabled={!newAffirmationText.trim()}
                    testID="save-affirmation-button"
                  >
                    <ThemedText style={[styles.modalButtonText, { color: "#fff" }]}>
                      {editingAffirmation ? "Save" : "Add"}
                    </ThemedText>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showDeleteConfirm !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.modalTitle}>Delete Affirmation</ThemedText>
            <ThemedText style={[styles.confirmText, { color: colors.textSecondary }]}>
              Are you sure you want to delete this affirmation?
            </ThemedText>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowDeleteConfirm(null)}
              >
                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.danger }]}
                onPress={handleDeleteAffirmation}
                testID="confirm-delete-button"
              >
                <ThemedText style={[styles.modalButtonText, { color: "#fff" }]}>
                  Delete
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
  },
  headerText: {
    ...Typography.small,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  affirmationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  affirmationContent: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  affirmationText: {
    ...Typography.body,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  usageText: {
    ...Typography.caption,
  },
  deleteButton: {
    padding: Spacing.sm,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyTitle: {
    ...Typography.h4,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    ...Typography.small,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
  },
  examplesTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  exampleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    width: "100%",
  },
  exampleText: {
    ...Typography.small,
    flex: 1,
    fontStyle: "italic",
    marginRight: Spacing.md,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: "600",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  inputLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  textInput: {
    ...Typography.body,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    minHeight: 80,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  categoryOptionText: {
    ...Typography.small,
    fontWeight: "500",
  },
  suggestionsSection: {
    marginBottom: Spacing.lg,
  },
  suggestionsTitle: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  suggestionsRow: {
    gap: Spacing.sm,
  },
  suggestionChip: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  suggestionText: {
    ...Typography.caption,
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
  confirmText: {
    ...Typography.body,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
});
