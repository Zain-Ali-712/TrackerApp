import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { THEME } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Apple, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  Lock, 
  RefreshCw, 
  Award, 
  Send, 
  MessageSquare, 
  Brain, 
  Bot, 
  Sparkles 
} from 'lucide-react-native';
import { Meal } from '../../types';
import { AIService } from '../../services/ai';

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
  const [activeTab, setActiveTab] = useState<'progress' | 'coach'>('progress');

  // Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'user' | 'ai'; text: string }>>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `🦁 **Salam, Zain Ali!** I'm your **AI Diet Coach**.\n\nI have loaded your daily goals (2400-3000 kcal range, 90g protein goal) and today's logged meals.\n\nAsk me anything about your remaining day's diet, meal planning, or protein rating!`
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);

  // Calculate totals
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);

  // Maintenance baseline is 2400 kcal
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

  const handleSendChatMessage = async (textToSend?: string) => {
    const messageText = textToSend || chatInput;
    if (!messageText.trim() || chatLoading) return;

    const userMsgId = String(Date.now());
    const newUserMessage = { id: userMsgId, sender: 'user' as const, text: messageText };
    setChatMessages((prev) => [...prev, newUserMessage]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);
    
    // Clear chat error on new request unless it remains empty key
    setChatError(openaiApiKey ? null : 'No Key');

    const chatHistory = chatMessages.concat(newUserMessage).map(m => ({
      role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text
    }));

    try {
      const result = await AIService.chatWithDietCoach(
        chatHistory,
        meals,
        { caloriesGoal, proteinGoal },
        openaiApiKey
      );
      
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: result.text
        }
      ]);
      
      if (result.error) {
        setChatError(result.error);
      }
    } catch (e: any) {
      console.warn(e);
      setChatError(e?.message || 'Failed to reach coach.');
      setChatMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `⚠️ Offline mode fallback activated. I had trouble connecting to the OpenAI server (possibly quota or network issue), but I can still help you! Based on your meals today, try eating a banana shake or egg paratha to push your protein surplus.`
        }
      ]);
    } finally {
      setChatLoading(false);
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

  // Custom Protein Status Rating
  const getProteinStatus = (protein: number) => {
    if (protein < 70) return { label: 'Bad Day', color: '#ef4444', textShadow: 'rgba(239, 68, 68, 0.4)' };
    if (protein < 75) return { label: 'Fair Day', color: '#f59e0b', textShadow: 'rgba(245, 158, 11, 0.4)' };
    if (protein < 80) return { label: 'Average Day', color: '#f97316', textShadow: 'rgba(249, 115, 22, 0.4)' };
    if (protein < 90) return { label: 'Good Day', color: '#eab308', textShadow: 'rgba(234, 179, 8, 0.4)' };
    if (protein <= 100) return { label: 'Great Day (Goal Met)', color: '#10b981', textShadow: 'rgba(16, 185, 129, 0.4)' };
    return { label: 'Elite Day (Surpassed)', color: '#06b6d4', textShadow: 'rgba(6, 182, 212, 0.4)' };
  };

  const proteinStatus = getProteinStatus(totalProtein);

  // Regex format builder for message text bolding
  const renderFormattedText = (text: string) => {
    const parts = text.split('**');
    return (
      <Text style={styles.chatMessageText}>
        {parts.map((part, index) => {
          const isBold = index % 2 === 1;
          return (
            <Text key={index} style={isBold ? { fontWeight: 'bold', color: '#ffffff' } : {}}>
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Locked status banner */}
      {dayLocked && (
        <View style={styles.lockBanner}>
          <Lock size={14} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.lockBannerText}>This day is locked and finalized.</Text>
        </View>
      )}

      {/* Segmented Tab Swapper */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('progress')} 
          style={[styles.tabButton, activeTab === 'progress' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'progress' && styles.tabButtonTextActive]}>
            Progress & Logs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('coach')} 
          style={[styles.tabButton, activeTab === 'coach' && styles.tabButtonActive]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Sparkles size={13} color={activeTab === 'coach' ? '#fff' : THEME.colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.tabButtonText, activeTab === 'coach' && styles.tabButtonTextActive]}>
              AI Diet Coach
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === 'progress' ? (
        // Progress & Logs View
        <View>
          {/* Dynamic Protein Rating Banner */}
          <Card style={[
            styles.ratingCard,
            {
              borderColor: proteinStatus.color + '44',
              shadowColor: proteinStatus.color,
            }
          ]}>
            <View style={styles.ratingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ratingSub}>Daily Protein Status</Text>
                <Text style={styles.ratingTitle}>{proteinStatus.label}</Text>
                <Text style={styles.ratingDesc}>
                  Target: 90g goal (minimum 80g). Current: {totalProtein}g.
                </Text>
              </View>
              <View style={[styles.ratingIconBadge, { backgroundColor: proteinStatus.color + '15', borderColor: proteinStatus.color + '33' }]}>
                <Award size={24} color={proteinStatus.color} />
              </View>
            </View>
          </Card>

          {/* Progress Cards */}
          <View style={styles.progressRow}>
            <Card style={[
              styles.progressCard, 
              { 
                flex: 1, 
                marginRight: THEME.spacing.xs,
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
                marginLeft: THEME.spacing.xs,
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
              
              {(!openaiApiKey || isAnalyzingMeal) && (
                <View style={styles.apiWarning}>
                  <ShieldAlert size={12} color={THEME.colors.warning} style={{ marginRight: 4 }} />
                  <Text style={styles.apiWarningText}>
                    {!openaiApiKey
                      ? "No OpenAI API Key added. Estimating locally using common desi meal lookups."
                      : "Analyzing meal contents..."}
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
                  backgroundColor: 'rgba(30, 41, 59, 0.75)',
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
        </View>
      ) : (
        // AI Diet Coach Chat View
        <View style={styles.chatContainer}>
          {/* Warning banner for API key issue or 429 */}
          {(!openaiApiKey || chatError?.includes('429')) && (
            <View style={styles.apiWarningBanner}>
              <ShieldAlert size={16} color={THEME.colors.warning} style={{ marginRight: 8 }} />
              <Text style={styles.apiWarningBannerText}>
                {!openaiApiKey 
                  ? "Offline Fallback Enabled: No OpenAI API key added. Using local Desi diet coach rules."
                  : "OpenAI Limit Exceeded (Error 429): Your API key is out of credits. The Offline Desi Coach is active to guide your goals!"}
              </Text>
            </View>
          )}

          {/* Chat Messages Scrolling Pane */}
          <View style={styles.chatFrame}>
            <ScrollView 
              style={styles.chatScroll} 
              contentContainerStyle={{ paddingVertical: THEME.spacing.xs }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {chatMessages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <View 
                    key={msg.id} 
                    style={[
                      styles.messageBubble, 
                      isAI ? styles.aiBubble : styles.userBubble
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <View style={[
                        styles.avatarContainer, 
                        isAI ? styles.aiAvatarBg : styles.userAvatarBg
                      ]}>
                        <Text style={[styles.avatarText, { color: isAI ? '#8b5cf6' : '#10b981' }]}>
                          {isAI ? 'AI' : 'ME'}
                        </Text>
                      </View>
                      <Text style={styles.avatarLabel}>
                        {isAI ? 'Diet Coach' : 'Zain'}
                      </Text>
                    </View>
                    {renderFormattedText(msg.text)}
                  </View>
                );
              })}
              
              {chatLoading && (
                <View style={[styles.messageBubble, styles.aiBubble, { paddingVertical: THEME.spacing.sm }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#8b5cf6" style={{ marginRight: 8 }} />
                    <Text style={[styles.chatMessageText, { color: THEME.colors.textMuted }]}>Coach is thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Presets Pills */}
          <View style={{ marginVertical: THEME.spacing.xs }}>
            <Text style={styles.suggestionTitleLabel}>TAP SUGGESTIONS:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              <TouchableOpacity 
                onPress={() => handleSendChatMessage('What should I eat for the remaining day?')}
                style={styles.presetPill}
                disabled={chatLoading}
              >
                <Text style={styles.presetPillText}>🥤 Remaining Day Diet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleSendChatMessage('Suggest a high-protein breakfast')}
                style={styles.presetPill}
                disabled={chatLoading}
              >
                <Text style={styles.presetPillText}>🍳 High-Protein Breakfast</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleSendChatMessage('Evaluate today\'s performance')}
                style={styles.presetPill}
                disabled={chatLoading}
              >
                <Text style={styles.presetPillText}>📊 Evaluate Today</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleSendChatMessage('Tell me about banana milkshakes')}
                style={styles.presetPill}
                disabled={chatLoading}
              >
                <Text style={styles.presetPillText}>🍌 Banana Milkshake Info</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Input Panel */}
          <View style={styles.chatInputRow}>
            <TextInput
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask diet coach (e.g. remaining day, eggs)..."
              placeholderTextColor={THEME.colors.textMuted}
              style={[
                styles.chatInput,
                isChatInputFocused && styles.chatInputFocused
              ]}
              onFocus={() => setIsChatInputFocused(true)}
              onBlur={() => setIsChatInputFocused(false)}
              onSubmitEditing={() => handleSendChatMessage()}
              editable={!chatLoading}
            />
            <TouchableOpacity 
              onPress={() => handleSendChatMessage()} 
              style={[
                styles.chatSendBtn,
                (!chatInput.trim() || chatLoading) && { opacity: 0.5 }
              ]}
              disabled={!chatInput.trim() || chatLoading}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingTop: Platform.OS === 'web' ? THEME.spacing.lg : 44,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 24,
    padding: 4,
    marginBottom: THEME.spacing.md,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.primary,
    ...THEME.shadows.glowGreen,
  },
  tabButtonText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  ratingCard: {
    padding: THEME.spacing.md,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1.5,
    borderRadius: THEME.radius.xl,
    marginBottom: THEME.spacing.sm + 2,
    elevation: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingSub: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ratingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginVertical: 1,
  },
  ratingDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 2,
  },
  ratingIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.xs,
  },
  progressCard: {
    padding: THEME.spacing.md,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
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
    fontSize: 10.5,
    fontWeight: '500',
    flex: 1,
  },
  suggestionCard: {
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
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

  // AI Chat styles
  chatContainer: {
    flex: 1,
    marginTop: 4,
  },
  chatFrame: {
    height: 320,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.xl,
    paddingHorizontal: THEME.spacing.sm,
  },
  chatScroll: {
    flex: 1,
  },
  messageBubble: {
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
    marginVertical: 6,
    maxWidth: '88%',
  },
  aiBubble: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    alignSelf: 'flex-start',
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1.2,
    borderBottomLeftRadius: 3,
  },
  userBubble: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignSelf: 'flex-end',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1.2,
    borderBottomRightRadius: 3,
  },
  chatMessageText: {
    color: '#e2e8f0',
    fontSize: 13.5,
    lineHeight: 18.5,
  },
  avatarContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  aiAvatarBg: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
  },
  userAvatarBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  avatarLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
  suggestionTitleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: THEME.spacing.sm,
    paddingHorizontal: 4,
  },
  presetScroll: {
    marginTop: 4,
  },
  presetPill: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  presetPillText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '600',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.xs,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.md,
    color: THEME.colors.text,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    fontSize: 14,
    height: 48,
    marginRight: THEME.spacing.sm,
  },
  chatInputFocused: {
    borderColor: THEME.colors.primary,
  },
  chatSendBtn: {
    width: 48,
    height: 48,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.glowGreen,
  },
  apiWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  apiWarningBannerText: {
    color: THEME.colors.warning,
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16.5,
  },
});
