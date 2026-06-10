import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { THEME } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Apple, Plus, Trash2, ShieldAlert, CheckCircle, Lock, RefreshCw } from 'lucide-react-native';
import { Meal } from '../../types';

export const NutritionScreen: React.FC = () => {
  const {
    selectedDate,
    meals,
    addMeal,
    deleteMeal,
    caloriesGoal,
    proteinGoal,
    openaiApiKey,
    isAnalyzingMeal,
  } = useAppStore();

  const [mealInput, setMealInput] = useState('');
  const [dayLocked, setDayLocked] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Calculate totals
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);

  // Surplus status calculation
  // Basic metabolic rate is estimated at 2400 kcal. Surplus is total calories minus maintenance (e.g. 2400 kcal)
  const maintenanceCalories = 2400;
  const surplusKcal = totalCalories - maintenanceCalories;

  const handleAddMeal = async () => {
    if (!mealInput.trim()) return;
    try {
      await addMeal(mealInput);
      setMealInput('');
    } catch (e) {
      Alert.alert('Error', 'Failed to analyze meal. Please check your internet or API key.');
    }
  };

  const handleDeleteMeal = (id?: number) => {
    if (id !== undefined) {
      deleteMeal(id);
    }
  };

  // Dynamic Desi Meal Suggestions Logic
  const getSuggestions = () => {
    const calDeficit = caloriesGoal - totalCalories;
    const protDeficit = proteinGoal - totalProtein;

    if (calDeficit <= 0 && protDeficit <= 0) {
      return {
        message: '🎯 Calorie surplus and protein targets achieved! Excellent discipline today.',
        food: 'No additional meals required. Keep up the high standard!'
      };
    }

    if (calDeficit > 1000) {
      return {
        message: '⚠️ Calorie deficit is currently very high. You need dense energy meals.',
        food: '👉 Try: 2 Parathas with 2 fried eggs + 1 glass Banana Shake (approx 1000 kcal, 24g protein) or a plate of Beef/Chicken Biryani.'
      };
    }

    if (calDeficit > 500) {
      return {
        message: 'Meal suggestion to achieve your surplus:',
        food: '👉 Try: 1 Plate rice with black chana salan or Roti with chicken salan + 1 cup chai (approx 650 kcal, 22g protein).'
      };
    }

    if (calDeficit > 200) {
      return {
        message: 'Remaining calories are low. Add a light evening snack:',
        food: '👉 Try: 2 Boiled Eggs and a glass of milk (approx 300 kcal, 20g protein).'
      };
    }

    if (protDeficit > 15) {
      return {
        message: 'Calories are close to goal, but you are lagging on protein:',
        food: '👉 Try: 3 Boiled Egg Whites or 1 glass of Banana shake with high-protein milk (approx 200 kcal, 18g protein).'
      };
    }

    return {
      message: 'Almost there! Finish the day strong.',
      food: '👉 Try: A small cup of mixed nuts or a cup of green tea with a banana (approx 150 kcal, 3g protein).'
    };
  };

  const suggestion = getSuggestions();

  const getSuggestionColor = () => {
    const calDeficit = caloriesGoal - totalCalories;
    const protDeficit = proteinGoal - totalProtein;
    if (calDeficit <= 0 && protDeficit <= 0) return THEME.colors.primary;
    if (calDeficit > 500) return THEME.colors.warning;
    return THEME.colors.accentPurple;
  };

  const suggestColor = getSuggestionColor();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Locked status banner */}
      {dayLocked && (
        <View style={styles.lockBanner}>
          <Lock size={14} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.lockBannerText}>This day is locked and finalized.</Text>
        </View>
      )}

      {/* Progress Cards */}
      <View style={styles.progressRow}>
        <Card style={[
          styles.progressCard, 
          { 
            flex: 1, 
            marginRight: THEME.spacing.sm,
            borderColor: totalCalories >= caloriesGoal ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
            shadowColor: totalCalories >= caloriesGoal ? THEME.colors.primary : THEME.colors.warning,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1.5,
          }
        ]}>
          <Text style={styles.progressLabel}>Calories</Text>
          <Text style={styles.progressVal}>{totalCalories} / {caloriesGoal} kcal</Text>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(100, (totalCalories / caloriesGoal) * 100)}%`,
                  backgroundColor: totalCalories >= caloriesGoal ? THEME.colors.primary : THEME.colors.warning 
                }
              ]} 
            />
          </View>
          <Text style={styles.percentText}>{Math.round((totalCalories / caloriesGoal) * 100)}% of Goal</Text>
        </Card>

        <Card style={[
          styles.progressCard, 
          { 
            flex: 1, 
            marginLeft: THEME.spacing.sm,
            borderColor: totalProtein >= proteinGoal ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
            shadowColor: totalProtein >= proteinGoal ? THEME.colors.primary : THEME.colors.warning,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1.5,
          }
        ]}>
          <Text style={styles.progressLabel}>Protein</Text>
          <Text style={styles.progressVal}>{totalProtein} / {proteinGoal}g</Text>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${Math.min(100, (totalProtein / proteinGoal) * 100)}%`,
                  backgroundColor: totalProtein >= proteinGoal ? THEME.colors.primary : THEME.colors.warning
                }
              ]} 
            />
          </View>
          <Text style={styles.percentText}>{Math.round((totalProtein / proteinGoal) * 100)}% of Goal</Text>
        </Card>
      </View>

      {/* Surplus Status Widget */}
      <Card style={styles.surplusCard}>
        <View style={styles.surplusRow}>
          <View>
            <Text style={styles.surplusLabel}>Est. Surplus Status</Text>
            <Text style={[styles.surplusVal, { color: surplusKcal >= 0 ? THEME.colors.primary : THEME.colors.textMuted }]}>
              {surplusKcal > 0 ? `+${surplusKcal}` : surplusKcal} kcal
            </Text>
          </View>
          <View style={styles.carbsCol}>
            <Text style={styles.surplusLabel}>Carbs Intake</Text>
            <Text style={styles.carbsVal}>{totalCarbs}g</Text>
          </View>
        </View>
      </Card>

      {/* Meal Entry Input */}
      {!dayLocked && (
        <View style={styles.entryContainer}>
          <Text style={styles.sectionTitle}>Log a Meal</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={mealInput}
              onChangeText={setMealInput}
              placeholder="e.g. 2 parathas with daal, banana shake..."
              placeholderTextColor={THEME.colors.textMuted}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              style={[
                styles.mealInput,
                isInputFocused && styles.mealInputFocused,
              ]}
              onSubmitEditing={handleAddMeal}
              editable={!isAnalyzingMeal}
            />
            <TouchableOpacity 
              onPress={handleAddMeal} 
              style={[
                styles.addBtn, 
                isAnalyzingMeal && { opacity: 0.7 },
                !isAnalyzingMeal && THEME.shadows.glowGreen,
              ]}
              disabled={isAnalyzingMeal}
            >
              {isAnalyzingMeal ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Plus size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {!openaiApiKey && (
            <View style={styles.apiWarning}>
              <ShieldAlert size={12} color={THEME.colors.warning} style={{ marginRight: 4 }} />
              <Text style={styles.apiWarningText}>
                No OpenAI API Key added. Estimating locally using common desi meal lookups.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Dynamic Suggestions */}
      <Text style={styles.sectionTitle}>Execution Recommendations</Text>
      <Card style={[
        styles.suggestionCard, 
        { 
          borderLeftColor: suggestColor, 
          backgroundColor: suggestColor + '08' 
        }
      ]}>
        <Text style={[styles.suggestionTitle, { color: suggestColor }]}>{suggestion.message}</Text>
        <Text style={styles.suggestionFood}>{suggestion.food}</Text>
      </Card>

      {/* Meal logs list */}
      <Text style={styles.sectionTitle}>Today's Meal Log</Text>
      {meals.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Apple size={28} color={THEME.colors.textMuted} style={{ marginBottom: 6 }} />
          <Text style={styles.emptyText}>No meals logged today yet.</Text>
        </Card>
      ) : (
        meals.map((meal) => (
          <Card key={meal.id} style={[
            styles.mealCard,
            {
              borderColor: 'rgba(255, 255, 255, 0.05)',
              backgroundColor: 'rgba(30, 41, 59, 0.25)',
            }
          ]}>
            <View style={styles.mealInfoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.meal_text}</Text>
                <View style={styles.macroRow}>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Text style={[styles.macroBadgeText, { color: '#ef4444' }]}>🔥 {meal.calories} kcal</Text>
                  </View>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.macroBadgeText, { color: '#10b981' }]}>💪 {meal.protein}g protein</Text>
                  </View>
                  <View style={[styles.macroBadge, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Text style={[styles.macroBadgeText, { color: '#f59e0b' }]}>🌾 {meal.carbs}g carbs</Text>
                  </View>
                </View>
              </View>
              {!dayLocked && (
                <TouchableOpacity 
                  onPress={() => handleDeleteMeal(meal.id)}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={16} color={THEME.colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))
      )}

      {/* End Day Locking Button */}
      <View style={styles.lockContainer}>
        {dayLocked ? (
          <Button
            title="Unlock Day Data"
            onPress={() => setDayLocked(false)}
            variant="secondary"
            style={styles.lockButton}
          />
        ) : (
          <Button
            title="Mark Day Complete & Lock"
            onPress={() => {
              Alert.alert(
                'Finalize Day',
                'Are you sure you want to finalize nutrition logs for today? This will lock inputs.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Finalize & Lock', onPress: () => setDayLocked(true) }
                ]
              );
            }}
            variant="primary"
            style={styles.lockButton}
          />
        )}
      </View>
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
    paddingBottom: 110,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.danger,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  lockBannerText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.xs,
  },
  progressCard: {
    padding: THEME.spacing.md,
  },
  progressLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  progressVal: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: THEME.colors.surface,
    borderRadius: 3,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    color: THEME.colors.textMuted,
    fontSize: 10.5,
    fontWeight: '500',
  },
  surplusCard: {
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  surplusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  surplusLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  surplusVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  carbsCol: {
    alignItems: 'flex-end',
  },
  carbsVal: {
    color: THEME.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 0.3,
  },
  entryContainer: {
    marginBottom: THEME.spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealInput: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceCard,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.md,
    color: THEME.colors.text,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    fontSize: 14.5,
    height: 50,
    marginRight: THEME.spacing.sm,
  },
  mealInputFocused: {
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apiWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  apiWarningText: {
    color: THEME.colors.warning,
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
  },
  suggestionCard: {
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
  },
  suggestionTitle: {
    color: THEME.colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  suggestionFood: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyCard: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 12.5,
    fontWeight: '500',
  },
  mealCard: {
    padding: THEME.spacing.sm + 2,
    marginVertical: 4,
  },
  mealInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  macroRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  macroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    marginRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: THEME.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
  },
  lockContainer: {
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.lg,
  },
  lockButton: {
    width: '100%',
  },
});
