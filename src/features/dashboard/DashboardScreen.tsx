import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { DBService } from '../../services/db';
import { THEME } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { CustomChart } from '../../components/CustomChart';
import { Calendar, ChevronLeft, ChevronRight, Award, Edit2, CheckCircle2 } from 'lucide-react-native';
import { DailyHabit } from '../../types';

export const DashboardScreen: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    dailyHabit,
    toggleHabit,
    updateNotes,
  } = useAppStore();

  const [notesText, setNotesText] = useState(dailyHabit.notes || '');
  const [historyDaysCount, setHistoryDaysCount] = useState<7 | 30>(7);
  const [weeklyHabits, setWeeklyHabits] = useState<DailyHabit[]>([]);

  // Keep notes state in sync when date changes
  useEffect(() => {
    setNotesText(dailyHabit.notes || '');
  }, [selectedDate, dailyHabit.notes]);

  // Load last 7 days history for weekly graph and timeline
  useEffect(() => {
    const dates = getPastDates(historyDaysCount);
    const history = DBService.getHabitsRange(dates[0], dates[dates.length - 1]);
    setWeeklyHabits(history);
  }, [selectedDate, dailyHabit, historyDaysCount]);

  const getPastDates = (count: number): string[] => {
    const datesList: string[] = [];
    const baseDate = new Date(selectedDate);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      datesList.push(d.toISOString().split('T')[0]);
    }
    return datesList;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getDateNum = (dateStr: string) => {
    return dateStr.split('-')[2];
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNotesSubmit = () => {
    updateNotes(notesText);
  };

  // Score categories calculations
  // Blue: Projects + Outreach (Outreach, Session 1, Session 2)
  // Orange: Calories + Protein + Workout (Workout, Calorie Goal, Protein Goal)
  // Gray: Wakeup + Sleep + Reading (Wakeup, Reading, Sleep)
  const getCategoryScore = (habit: DailyHabit, category: 'blue' | 'orange' | 'gray'): number => {
    let completed = 0;
    if (category === 'blue') {
      completed = habit.outreach + habit.project_session_1 + habit.project_session_2;
    } else if (category === 'orange') {
      completed = habit.workout + habit.calories_goal + habit.protein_goal;
    } else if (category === 'gray') {
      completed = habit.wakeup + habit.reading + habit.sleep_8hr;
    }
    return Math.round((completed / 3) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return THEME.colors.primary;
    if (score >= 50) return THEME.colors.warning;
    return THEME.colors.danger;
  };

  // Prepare graph dataset
  const graphLabels = weeklyHabits.map(h => getDayName(h.date));
  const blueLineValues = weeklyHabits.map(h => getCategoryScore(h, 'blue'));
  const orangeLineValues = weeklyHabits.map(h => getCategoryScore(h, 'orange'));
  const grayLineValues = weeklyHabits.map(h => getCategoryScore(h, 'gray'));

  const datasets = [
    { label: 'Work & Outreach', values: blueLineValues, color: THEME.colors.accentBlue },
    { label: 'Nutrition & Fitness', values: orangeLineValues, color: THEME.colors.primary },
    { label: 'Sleep & Habits', values: grayLineValues, color: THEME.colors.accentGray },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Date Header Switcher */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.dateNavBtn}>
          <ChevronLeft size={20} color={THEME.colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Calendar size={16} color={THEME.colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.dateText}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <TouchableOpacity onPress={() => shiftDate(1)} style={styles.dateNavBtn}>
          <ChevronRight size={20} color={THEME.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Scrolling Timeline */}
      <View style={styles.timelineContainer}>
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>Timeline History</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity 
              onPress={() => setHistoryDaysCount(7)} 
              style={[styles.toggleBtn, historyDaysCount === 7 && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, historyDaysCount === 7 && styles.toggleBtnTextActive]}>7D</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setHistoryDaysCount(30)} 
              style={[styles.toggleBtn, historyDaysCount === 30 && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, historyDaysCount === 30 && styles.toggleBtnTextActive]}>30D</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineScroll}>
          {weeklyHabits.map((h) => {
            const isSelected = h.date === selectedDate;
            const dayName = getDayName(h.date);
            const dateNum = getDateNum(h.date);
            return (
              <TouchableOpacity
                key={h.date}
                onPress={() => setSelectedDate(h.date)}
                style={[
                  styles.timelineItem,
                  isSelected && styles.timelineItemActive,
                  { borderBottomColor: getScoreColor(h.score) }
                ]}
              >
                <Text style={[styles.timelineDay, isSelected && styles.timelineTextActive]}>{dayName}</Text>
                <Text style={[styles.timelineDate, isSelected && styles.timelineTextActive]}>{dateNum}</Text>
                <View style={[styles.timelineScoreDot, { backgroundColor: getScoreColor(h.score) }]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary Score Card */}
      <Card style={[
        styles.scoreCard,
        {
          shadowColor: getScoreColor(dailyHabit.score),
          borderColor: getScoreColor(dailyHabit.score) + '33', // 20% opacity border of score color
          borderWidth: 1.5,
        }
      ]}>
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreSub}>Discipline Rating</Text>
            <Text style={styles.scoreTitle}>Today's Score</Text>
            <View style={styles.scoreBadgeRow}>
              <Award size={14} color={getScoreColor(dailyHabit.score)} style={{ marginRight: 4 }} />
              <Text style={[styles.scoreBadgeText, { color: getScoreColor(dailyHabit.score) }]}>
                {dailyHabit.score >= 80 ? 'Excellent' : dailyHabit.score >= 50 ? 'Consistent' : 'Building'}
              </Text>
            </View>
          </View>
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(dailyHabit.score) }]}>
            <Text style={[styles.scoreCircleText, { color: getScoreColor(dailyHabit.score) }]}>
              {dailyHabit.score}%
            </Text>
          </View>
        </View>
      </Card>

      {/* Daily Habits Checklist */}
      <Text style={styles.sectionTitle}>Daily Execution Plan</Text>
      
      {/* Category: Work & Outreach */}
      <Card style={styles.categoryCardPurple}>
        <View style={styles.categoryHeaderRow}>
          <Text style={[styles.categoryHeader, { color: '#8b5cf6' }]}>Work & Outreach</Text>
          <Text style={styles.categoryProgressText}>{blueLineValues[blueLineValues.length - 1] !== undefined ? Math.round(blueLineValues[blueLineValues.length - 1] / 100 * 3) : 0} / 3</Text>
        </View>
        <View style={styles.miniProgressBarBg}>
          <View style={[styles.miniProgressBarFill, { width: `${blueLineValues[blueLineValues.length - 1] || 0}%`, backgroundColor: '#8b5cf6' }]} />
        </View>
        
        <Checkbox
          checked={dailyHabit.outreach === 1}
          onPress={() => toggleHabit('outreach')}
          label="Outreach"
          sublabel="Client pitching & lead CRM updates"
          typeColor="#8b5cf6"
        />
        <Checkbox
          checked={dailyHabit.project_session_1 === 1}
          onPress={() => toggleHabit('project_session_1')}
          label="Project Work Session 1"
          sublabel="Focus work session on active projects"
          typeColor="#8b5cf6"
        />
        <Checkbox
          checked={dailyHabit.project_session_2 === 1}
          onPress={() => toggleHabit('project_session_2')}
          label="Project Work Session 2"
          sublabel="Second project development session"
          typeColor="#8b5cf6"
        />
      </Card>

      {/* Category: Fitness & Nutrition */}
      <Card style={styles.categoryCardGreen}>
        <View style={styles.categoryHeaderRow}>
          <Text style={[styles.categoryHeader, { color: '#10b981' }]}>Fitness & Nutrition</Text>
          <Text style={styles.categoryProgressText}>{orangeLineValues[orangeLineValues.length - 1] !== undefined ? Math.round(orangeLineValues[orangeLineValues.length - 1] / 100 * 3) : 0} / 3</Text>
        </View>
        <View style={styles.miniProgressBarBg}>
          <View style={[styles.miniProgressBarFill, { width: `${orangeLineValues[orangeLineValues.length - 1] || 0}%`, backgroundColor: '#10b981' }]} />
        </View>

        <Checkbox
          checked={dailyHabit.workout === 1}
          onPress={() => toggleHabit('workout')}
          label="Workout"
          sublabel="Target weight gain & muscle routine"
          typeColor="#10b981"
        />
        <Checkbox
          checked={dailyHabit.calories_goal === 1}
          onPress={() => toggleHabit('calories_goal')}
          label="Calorie Goal Achieved"
          sublabel="Target surplus intake (Auto-completed via Nutrition Tab)"
          typeColor="#10b981"
        />
        <Checkbox
          checked={dailyHabit.protein_goal === 1}
          onPress={() => toggleHabit('protein_goal')}
          label="Protein Goal Achieved"
          sublabel="Target protein intake (Auto-completed via Nutrition Tab)"
          typeColor="#10b981"
        />
      </Card>

      {/* Category: Recovery & Personal Habits */}
      <Card style={styles.categoryCardYellow}>
        <View style={styles.categoryHeaderRow}>
          <Text style={[styles.categoryHeader, { color: '#f59e0b' }]}>Habits & Learning</Text>
          <Text style={styles.categoryProgressText}>{grayLineValues[grayLineValues.length - 1] !== undefined ? Math.round(grayLineValues[grayLineValues.length - 1] / 100 * 3) : 0} / 3</Text>
        </View>
        <View style={styles.miniProgressBarBg}>
          <View style={[styles.miniProgressBarFill, { width: `${grayLineValues[grayLineValues.length - 1] || 0}%`, backgroundColor: '#f59e0b' }]} />
        </View>

        <Checkbox
          checked={dailyHabit.wakeup === 1}
          onPress={() => toggleHabit('wakeup')}
          label="Wake up at 4 AM"
          sublabel="Early rising morning routine"
          typeColor="#f59e0b"
        />
        <Checkbox
          checked={dailyHabit.reading === 1}
          onPress={() => toggleHabit('reading')}
          label="Reading"
          sublabel="Read self-improvement / tech material"
          typeColor="#f59e0b"
        />
        <Checkbox
          checked={dailyHabit.sleep_8hr === 1}
          onPress={() => toggleHabit('sleep_8hr')}
          label="8 Hours Sleep"
          sublabel="Recovery and physical health recharge"
          typeColor="#f59e0b"
        />
      </Card>

      {/* Weekly Progress Analytics Graph */}
      <Text style={styles.sectionTitle}>Weekly Discipline Trends</Text>
      <Card style={styles.graphCard}>
        {weeklyHabits.length > 0 ? (
          <CustomChart
            type="line"
            labels={graphLabels}
            datasets={datasets}
            maxY={100}
            ySuffix="%"
            height={200}
          />
        ) : (
          <Text style={styles.emptyText}>Loading graph logs...</Text>
        )}
      </Card>

      {/* Daily Notes / Journal */}
      <Text style={styles.sectionTitle}>Daily Journal Notes</Text>
      <Card style={styles.journalCard}>
        <View style={styles.journalHeader}>
          <Edit2 size={14} color={THEME.colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.journalTitle}>Write observations & notes</Text>
        </View>
        <TextInput
          value={notesText}
          onChangeText={setNotesText}
          placeholder="How did today go? Log workout notes, client feedback, or reminders..."
          placeholderTextColor={THEME.colors.textMuted}
          multiline
          numberOfLines={4}
          style={styles.journalInput}
          onBlur={handleNotesSubmit}
        />
        <TouchableOpacity onPress={handleNotesSubmit} style={styles.saveNotesBtn}>
          <CheckCircle2 size={13} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.saveNotesText}>Save Journal Entry</Text>
        </TouchableOpacity>
      </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
  },
  dateText: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  timelineContainer: {
    marginBottom: THEME.spacing.lg,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.surfaceCard,
  },
  toggleBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: THEME.colors.text,
  },
  timelineScroll: {
    flexDirection: 'row',
    paddingVertical: THEME.spacing.xs,
  },
  timelineItem: {
    backgroundColor: THEME.colors.surfaceCard,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderRadius: THEME.radius.md,
    width: 55,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: THEME.spacing.sm,
  },
  timelineItemActive: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.text,
  },
  timelineDay: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  timelineDate: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  timelineTextActive: {
    color: THEME.colors.primary,
  },
  timelineScoreDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 3,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 0.3,
  },
  scoreCard: {
    padding: THEME.spacing.lg,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreTitle: {
    color: THEME.colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 2,
  },
  scoreBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  scoreCircleText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  categoryCardPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.04)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1.5,
    borderLeftWidth: 5,
    borderLeftColor: '#8b5cf6',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderLeftWidth: 5,
    borderLeftColor: '#10b981',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryCardYellow: {
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1.5,
    borderLeftWidth: 5,
    borderLeftColor: '#f59e0b',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.xs,
  },
  categoryHeader: {
    fontSize: 12.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  categoryProgressText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  miniProgressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    marginBottom: THEME.spacing.md,
    overflow: 'hidden',
    width: '100%',
  },
  miniProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  graphCard: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    padding: THEME.spacing.xl,
  },
  journalCard: {
    padding: THEME.spacing.md,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  journalTitle: {
    color: THEME.colors.text,
    fontSize: 13.5,
    fontWeight: '600',
  },
  journalInput: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.md,
    color: THEME.colors.text,
    padding: THEME.spacing.sm,
    fontSize: 13.5,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveNotesBtn: {
    backgroundColor: THEME.colors.primary,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    paddingVertical: THEME.spacing.sm - 2,
    paddingHorizontal: THEME.spacing.md,
    alignSelf: 'flex-start',
    marginTop: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...THEME.shadows.glowGreen,
  },
  saveNotesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
