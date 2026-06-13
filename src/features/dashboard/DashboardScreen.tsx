import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useAppStore, getTodayDateString } from '../../store/useAppStore';
import { DBService } from '../../services/db';
import { THEME } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Checkbox } from '../../components/ui/Checkbox';
import { CustomChart } from '../../components/CustomChart';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  Edit2, 
  CheckCircle2, 
  Lock,
  Send,
  Briefcase,
  BookOpen,
  Dumbbell,
  Apple,
  Moon,
  Clock,
  Heart,
  Smartphone,
  Smile
} from 'lucide-react-native';
import { DailyHabit } from '../../types';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// Custom Premium SVG Progress Ring Component with neon gradient and glows
const ProgressRing: React.FC<{ size: number; strokeWidth: number; progress: number; color: string }> = ({
  size,
  strokeWidth,
  progress,
  color,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  const getGradientEndColor = (startColor: string) => {
    if (startColor === '#22c55e' || startColor === '#84cc16' || startColor === '#10b981') {
      return '#06b6d4'; // Neon Teal
    }
    if (startColor === '#eab308' || startColor === '#f97316') {
      return '#ec4899'; // Neon Pink
    }
    return '#881337'; // Crimson
  };

  const gradientEnd = getGradientEndColor(color);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientEnd} stopOpacity="0.85" />
          </LinearGradient>
        </Defs>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Glowing progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
      {/* Center score labels */}
      <View style={styles.scoreTextContainer}>
        <Text style={[styles.scorePercentText, { textShadowColor: color, textShadowRadius: 8 }]}>
          {progress}%
        </Text>
        <Text style={styles.scoreLabelSub}>Rating</Text>
      </View>
    </View>
  );
};

export const DashboardScreen: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    dailyHabit,
    toggleHabit,
    setDailyNotes,
    saveDailyNotes,
    caloriesGoal,
    proteinGoal,
    meals,
    outreachEntries,
  } = useAppStore();

  const [notesText, setNotesText] = useState(dailyHabit.notes || '');
  const [lastSavedText, setLastSavedText] = useState(dailyHabit.notes || '');
  const [inputHeight, setInputHeight] = useState(90);
  const [isJournalFocused, setIsJournalFocused] = useState(false);
  const [bottomHistoryMode, setBottomHistoryMode] = useState<'7d' | '30d'>('30d');
  const [viewedDate, setViewedDate] = useState(new Date());
  
  const [weeklyHabits, setWeeklyHabits] = useState<DailyHabit[]>([]);
  const [monthlyHabits, setMonthlyHabits] = useState<DailyHabit[]>([]);
  const [projectHours, setProjectHours] = useState(0);

  const viewedYear = viewedDate.getFullYear();
  const viewedMonth = viewedDate.getMonth();

  // Sync text inputs when selected date/habit changes
  useEffect(() => {
    setNotesText(dailyHabit.notes || '');
    setLastSavedText(dailyHabit.notes || '');
  }, [selectedDate, dailyHabit.notes]);

  // Debounce SQLite database writes by 1000ms after user pauses typing
  useEffect(() => {
    if (notesText.trim() === lastSavedText.trim()) return;

    const timer = setTimeout(() => {
      saveDailyNotes();
      setLastSavedText(notesText);
    }, 1000);

    return () => clearTimeout(timer);
  }, [notesText]);

  // Load last 7 days history for weekly trends graph
  useEffect(() => {
    const dates = getPastDates(7);
    const history = DBService.getHabitsRange(dates[0], dates[dates.length - 1]);
    setWeeklyHabits(history);
  }, [selectedDate, dailyHabit]);

  // Load project hours for the active date
  useEffect(() => {
    const logs = DBService.getAllProjectLogsRange(selectedDate, selectedDate);
    const hours = logs.reduce((acc, log) => acc + log.hours_worked, 0);
    setProjectHours(hours);
  }, [selectedDate, dailyHabit]);

  // Load calendar monthly habits
  useEffect(() => {
    const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
    const startStr = `${viewedYear}-${String(viewedMonth + 1).padStart(2, '0')}-01`;
    const endStr = `${viewedYear}-${String(viewedMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const history = DBService.getHabitsRange(startStr, endStr);
    setMonthlyHabits(history);
  }, [viewedDate, selectedDate, dailyHabit]);

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
    const dateStr = d.toISOString().split('T')[0];
    const todayStr = getTodayDateString();
    
    // Prevent navigating to future dates
    if (dateStr <= todayStr) {
      setSelectedDate(dateStr);
    }
  };

  const getWordCount = (text: string): number => {
    const cleanText = text.trim();
    if (!cleanText) return 0;
    return cleanText.split(/\s+/).length;
  };

  const handleNotesChange = (text: string) => {
    setNotesText(text);
    setDailyNotes(text);
  };

  const handleNotesSubmit = () => {
    setDailyNotes(notesText);
    saveDailyNotes();
    setLastSavedText(notesText);
  };

  // Live Check Calculations
  const outreachCount = outreachEntries.filter(e => e.date === selectedDate).length;
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const wordCount = getWordCount(notesText);

  // Dynamic Live-Updating Score Categories & Totals for Graph lines
  const getWorkScore = (habit: DailyHabit, dateStr: string): number => {
    let score = 0;
    const outreachForDay = DBService.getOutreachEntries().filter(e => e.date === dateStr);
    const count = outreachForDay.length;
    if (count >= 10) {
      const scalePercent = Math.min(100, 50 + (count - 10) * 5);
      score += 18 * (scalePercent / 100);
    }
    if (habit.project_implementation === 1) score += 12;
    if (habit.research_learning === 1) score += 10;
    return Math.round((score / 40) * 100);
  };

  const getFitnessScore = (habit: DailyHabit): number => {
    let score = 0;
    if (habit.workout === 1) score += 15;
    if (habit.nutrition === 1) score += 14;
    if (habit.sleep_8hr === 1) score += 6;
    return Math.round((score / 35) * 100);
  };

  const getHabitsScore = (habit: DailyHabit, localReadingChecked: boolean): number => {
    let score = 0;
    if (habit.wakeup === 1) score += 5;
    if (localReadingChecked) score += 5;
    if (habit.prayers === 1) score += 5;
    if (habit.scrolling === 1) score += 5;
    if (habit.feeling_improved === 1) score += 5;
    return Math.round((score / 25) * 100);
  };

  const liveScore = dailyHabit.score;

  const getTimelineScoreColor = (score: number) => {
    if (score <= 60) return '#ef4444'; // Red
    if (score <= 70) return '#f97316'; // Orange-Red
    if (score <= 80) return '#eab308'; // Orange-Yellow
    if (score <= 90) return '#84cc16'; // Light Green
    return '#22c55e'; // Green
  };

  const getScoreColor = (score: number) => {
    return getTimelineScoreColor(score);
  };

  const getDisciplineStatus = (score: number) => {
    if (score >= 90) return 'Elite';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Consistent';
    if (score >= 60) return 'Improving';
    return 'Building';
  };

  const getWorkCompletedCount = () => {
    let count = 0;
    if (outreachCount >= 10) count++;
    if (projectHours >= 3) count++;
    if (dailyHabit.research_learning === 1) count++;
    return count;
  };

  const getFitnessCompletedCount = () => {
    let count = 0;
    if (dailyHabit.workout === 1) count++;
    if (dailyHabit.nutrition === 1) count++;
    if (dailyHabit.sleep_8hr === 1) count++;
    return count;
  };

  const getHabitsCompletedCount = () => {
    let count = 0;
    if (dailyHabit.wakeup === 1) count++;
    if (dailyHabit.reading === 1) count++;
    if (dailyHabit.prayers === 1) count++;
    if (dailyHabit.scrolling === 1) count++;
    if (dailyHabit.feeling_improved === 1) count++;
    return count;
  };

  // Prepare graph dataset
  const graphLabels = weeklyHabits.map(h => getDayName(h.date));
  const blueLineValues = weeklyHabits.map(h => getWorkScore(h, h.date));
  const orangeLineValues = weeklyHabits.map(h => getFitnessScore(h));
  const grayLineValues = weeklyHabits.map(h => getHabitsScore(h, h.date === selectedDate ? dailyHabit.reading === 1 : h.reading === 1));

  const datasets = [
    { label: 'Work & Outreach', values: blueLineValues, color: '#8b5cf6' },
    { label: 'Nutrition & Fitness', values: orangeLineValues, color: '#10b981' },
    { label: 'Sleep & Habits', values: grayLineValues, color: '#f59e0b' },
  ];

  // Month navigation logic
  const todayDate = new Date();
  const isNextMonthFuture = viewedYear > todayDate.getFullYear() || 
    (viewedYear === todayDate.getFullYear() && viewedMonth >= todayDate.getMonth());

  const handlePrevMonth = () => {
    setViewedDate(new Date(viewedYear, viewedMonth - 1, 1));
  };

  const handleNextMonth = () => {
    if (!isNextMonthFuture) {
      setViewedDate(new Date(viewedYear, viewedMonth + 1, 1));
    }
  };

  const get7Days = (): string[] => {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const render7Days = () => {
    const sevenDaysList = get7Days();
    return (
      <View style={styles.sevenDaysContainer}>
        {sevenDaysList.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const dayName = getDayName(dateStr);
          const dateNum = getDateNum(dateStr);
          const habit = monthlyHabits.find(h => h.date === dateStr) || DBService.getHabit(dateStr);
          const scoreColor = getTimelineScoreColor(habit.score);
          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => setSelectedDate(dateStr)}
              style={[
                styles.sevenDaysItem,
                isSelected && styles.sevenDaysItemActive,
                { 
                  borderColor: isSelected ? '#ffffff' : scoreColor + '55', 
                  backgroundColor: scoreColor + '18' 
                }
              ]}
            >
              <Text style={styles.sevenDaysDay}>{dayName}</Text>
              <Text style={[
                styles.sevenDaysDate,
                isSelected && { color: THEME.colors.primary, fontWeight: '800' }
              ]}>
                {dateNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
    const firstDayIndex = new Date(viewedYear, viewedMonth, 1).getDay();
    
    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalCells = [...blanks, ...days];
    const todayStr = getTodayDateString();
    
    return (
      <View style={styles.calendarGrid}>
        <View style={styles.weekdaysContainer}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Text key={`weekday-${idx}`} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.calendarCellsContainer}>
          {totalCells.map((cell, idx) => {
            if (cell === null) {
              return (
                <View key={`blank-${idx}`} style={styles.calendarBlankCell}>
                  <View style={styles.calendarBlankDot} />
                </View>
              );
            }
            
            const dateStr = `${viewedYear}-${String(viewedMonth + 1).padStart(2, '0')}-${String(cell).padStart(2, '0')}`;
            const isFuture = dateStr > todayStr;
            
            if (isFuture) {
              return (
                <View key={`future-${cell}`} style={styles.calendarBlankCell}>
                  <View style={styles.calendarBlankDot} />
                </View>
              );
            }
            
            const habitForDay = monthlyHabits.find(h => h.date === dateStr) || DBService.createEmptyHabit(dateStr);
            const scoreColor = getTimelineScoreColor(habitForDay.score);
            const isSelected = dateStr === selectedDate;
            
            return (
              <TouchableOpacity
                key={`day-${cell}`}
                onPress={() => setSelectedDate(dateStr)}
                style={[
                  styles.calendarDayCell,
                  isSelected && styles.calendarDayCellActive,
                  { 
                    borderColor: isSelected ? '#ffffff' : scoreColor + '55', 
                    backgroundColor: scoreColor + '18' 
                  }
                ]}
              >
                <Text style={[
                  styles.calendarDayText,
                  isSelected && { color: '#ffffff', fontWeight: '800' }
                ]}>
                  {cell}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const todayStr = getTodayDateString();
  const isNextDayFuture = selectedDate >= todayStr;
  const isModified = notesText.trim() !== lastSavedText.trim();
  const canSave = isModified;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Welcome Header greeting (mockup style) */}
      <View style={styles.welcomeContainer}>
        <View>
          <Text style={styles.welcomeSubText}>DISCIPLINE OPERATING SYSTEM</Text>
          {Platform.OS === 'web' && <Text style={styles.welcomeTitleText}>Welcome back, Champion</Text>}
        </View>
        <View style={styles.avatarGlowBorder}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>C</Text>
          </View>
        </View>
      </View>

      {/* Date Header Switcher - Sleek Unified Pill */}
      <View style={styles.headerContainer}>
        <View style={styles.dateSwitcherPill}>
          <TouchableOpacity onPress={() => shiftDate(-1)} style={styles.datePillNavBtn}>
            <ChevronLeft size={16} color={THEME.colors.text} />
          </TouchableOpacity>
          
          <View style={styles.datePillTextContainer}>
            <CalendarIcon size={12} color={THEME.colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.datePillText}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => shiftDate(1)} 
            disabled={isNextDayFuture} 
            style={[styles.datePillNavBtn, isNextDayFuture && { opacity: 0.25 }]}
          >
            <ChevronRight size={16} color={THEME.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Futuristic Score Ring Card */}
      <Card style={[
        styles.scoreCard,
        {
          borderColor: getScoreColor(liveScore) + '33',
          shadowColor: getScoreColor(liveScore),
        }
      ]}>
        <View style={styles.scoreRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreSub}>Live Performance</Text>
            <Text style={styles.scoreTitle}>Today's Score</Text>
            <View style={styles.scoreBadgeRow}>
              <Award size={14} color={getScoreColor(liveScore)} style={{ marginRight: 6 }} />
              <Text style={[styles.scoreBadgeText, { color: getScoreColor(liveScore) }]}>
                {getDisciplineStatus(liveScore)} Rating
              </Text>
            </View>
            <Text style={styles.liveIndicator}>• Updates Live As You Complete Tasks</Text>
          </View>
          
          <ProgressRing 
            size={90} 
            strokeWidth={7} 
            progress={liveScore} 
            color={getScoreColor(liveScore)} 
          />
        </View>
      </Card>

      {/* Daily Habits Checklist */}
      <Text style={styles.sectionTitle}>Daily Execution Plan</Text>
      
      {/* Category: Work & Outreach */}
      <Card style={styles.categoryCardPurple}>
        <View style={styles.categoryHeaderRow}>
          <Text style={[styles.categoryHeader, { color: '#8b5cf6' }]}>Work & Outreach (40% Weight)</Text>
          <Text style={styles.categoryProgressText}>{getWorkCompletedCount()} / 3</Text>
        </View>
        <View style={styles.miniProgressBarBg}>
          <View style={[styles.miniProgressBarFill, { width: `${(getWorkCompletedCount() / 3) * 100}%`, backgroundColor: '#8b5cf6' }]} />
        </View>
        
        <View style={[styles.checklistCapsule, dailyHabit.outreach === 1 && styles.checklistCapsuleCompletedPurple]}>
          <Checkbox
            checked={dailyHabit.outreach === 1}
            onPress={() => toggleHabit('outreach')}
            label="Outreach"
            sublabel={outreachCount >= 10 
              ? `Checked! ${outreachCount} pitches logged (Scales to 20 for 100%) [18% Weight]` 
              : `Requires >=10 pitches today (${outreachCount}/10 logged) [18% Weight]`
            }
            typeColor="#8b5cf6"
            disabled={outreachCount < 10}
            icon={<Send size={15} color="#8b5cf6" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.project_implementation === 1 && styles.checklistCapsuleCompletedPurple]}>
          <Checkbox
            checked={dailyHabit.project_implementation === 1}
            onPress={() => toggleHabit('project_implementation')}
            label="Project Implementation"
            sublabel={projectHours >= 3 
              ? `Checked! Logged ${projectHours.toFixed(1)}h of project work [12% Weight]` 
              : `Requires >=3h work today (${projectHours.toFixed(1)}h/3h logged) [12% Weight]`
            }
            typeColor="#8b5cf6"
            disabled={projectHours < 3}
            icon={<Briefcase size={15} color="#8b5cf6" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.research_learning === 1 && styles.checklistCapsuleCompletedPurple]}>
          <Checkbox
            checked={dailyHabit.research_learning === 1}
            onPress={() => toggleHabit('research_learning')}
            label="Research & Learning"
            sublabel="Study documentation, courses, or explore new tools [10% Weight]"
            typeColor="#8b5cf6"
            icon={<BookOpen size={15} color="#8b5cf6" />}
          />
        </View>
      </Card>

      {/* Category: Fitness & Nutrition */}
      <Card style={styles.categoryCardGreen}>
        <View style={styles.categoryHeaderRow}>
          <Text style={[styles.categoryHeader, { color: '#10b981' }]}>Fitness & Nutrition (35% Weight)</Text>
          <Text style={styles.categoryProgressText}>{getFitnessCompletedCount()} / 3</Text>
        </View>
        <View style={styles.miniProgressBarBg}>
          <View style={[styles.miniProgressBarFill, { width: `${(getFitnessCompletedCount() / 3) * 100}%`, backgroundColor: '#10b981' }]} />
        </View>

        <View style={[styles.checklistCapsule, dailyHabit.workout === 1 && styles.checklistCapsuleCompletedGreen]}>
          <Checkbox
            checked={dailyHabit.workout === 1}
            onPress={() => toggleHabit('workout')}
            label="Workout"
            sublabel="Target weight gain & muscle routine [15% Weight]"
            typeColor="#10b981"
            icon={<Dumbbell size={15} color="#10b981" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.nutrition === 1 && styles.checklistCapsuleCompletedGreen]}>
          <Checkbox
            checked={dailyHabit.nutrition === 1}
            onPress={() => toggleHabit('nutrition')}
            label="Nutrition (Surplus)"
            sublabel={dailyHabit.nutrition === 1 
              ? `Checked! Both Calorie and Protein goals achieved [14% Weight]` 
              : `Requires Calories & Protein goals (${totalCalories}/${caloriesGoal} kcal, ${totalProtein}/${proteinGoal}g) [14% Weight]`
            }
            typeColor="#10b981"
            disabled={!(totalCalories >= caloriesGoal && totalProtein >= proteinGoal)}
            icon={<Apple size={15} color="#10b981" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.sleep_8hr === 1 && styles.checklistCapsuleCompletedGreen]}>
          <Checkbox
            checked={dailyHabit.sleep_8hr === 1}
            onPress={() => toggleHabit('sleep_8hr')}
            label="Sleep 7-8 Hours"
            sublabel="Physical recovery and cognitive health [6% Weight]"
            typeColor="#10b981"
            icon={<Moon size={15} color="#10b981" />}
          />
        </View>
      </Card>

      {/* Category: Recovery & Personal Habits */}
      <Card style={styles.categoryCardYellow}>
        <View style={styles.categoryHeaderRow}>
          <Text style={[styles.categoryHeader, { color: '#f59e0b' }]}>Habits & Learning (25% Weight)</Text>
          <Text style={styles.categoryProgressText}>{getHabitsCompletedCount()} / 5</Text>
        </View>
        <View style={styles.miniProgressBarBg}>
          <View style={[styles.miniProgressBarFill, { width: `${(getHabitsCompletedCount() / 5) * 100}%`, backgroundColor: '#f59e0b' }]} />
        </View>

        <View style={[styles.checklistCapsule, dailyHabit.wakeup === 1 && styles.checklistCapsuleCompletedYellow]}>
          <Checkbox
            checked={dailyHabit.wakeup === 1}
            onPress={() => toggleHabit('wakeup')}
            label="Wake up at 4 AM"
            sublabel="Early morning rising productivity routine [5% Weight]"
            typeColor="#f59e0b"
            icon={<Clock size={15} color="#f59e0b" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.reading === 1 && styles.checklistCapsuleCompletedYellow]}>
          <Checkbox
            checked={dailyHabit.reading === 1}
            onPress={() => {}} // Auto-checked dynamically
            label="Reading / Writing"
            sublabel={dailyHabit.reading === 1 
              ? `Checked! Journal word count goal achieved (${wordCount} words) [5% Weight]` 
              : `Requires >=80 words in Journal notes below (${wordCount}/80 words) [5% Weight]`
            }
            typeColor="#f59e0b"
            disabled={dailyHabit.reading !== 1}
            icon={<BookOpen size={15} color="#f59e0b" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.prayers === 1 && styles.checklistCapsuleCompletedYellow]}>
          <Checkbox
            checked={dailyHabit.prayers === 1}
            onPress={() => toggleHabit('prayers')}
            label="Prayers (5 Daily)"
            sublabel="Spiritual focus and daily consistency [5% Weight]"
            typeColor="#f59e0b"
            icon={<Heart size={15} color="#f59e0b" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.scrolling === 1 && styles.checklistCapsuleCompletedYellow]}>
          <Checkbox
            checked={dailyHabit.scrolling === 1}
            onPress={() => toggleHabit('scrolling')}
            label="Bloom Scrolling Control"
            sublabel="Mindful screen time and avoiding social scrolling [5% Weight]"
            typeColor="#f59e0b"
            icon={<Smartphone size={15} color="#f59e0b" />}
          />
        </View>
        <View style={[styles.checklistCapsule, dailyHabit.feeling_improved === 1 && styles.checklistCapsuleCompletedYellow]}>
          <Checkbox
            checked={dailyHabit.feeling_improved === 1}
            onPress={() => toggleHabit('feeling_improved')}
            label="Feeling Improved"
            sublabel="Positive mindset check and mental growth progression [5% Weight]"
            typeColor="#f59e0b"
            icon={<Smile size={15} color="#f59e0b" />}
          />
        </View>
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
          onChangeText={handleNotesChange}
          placeholder="How did today go? Log workout notes, client feedback, or reflections (min 80 words for checkbox)..."
          placeholderTextColor={THEME.colors.textMuted}
          multiline
          onFocus={() => setIsJournalFocused(true)}
          onBlur={() => {
            setIsJournalFocused(false);
            handleNotesSubmit();
          }}
          onContentSizeChange={(e) => {
            setInputHeight(Math.max(90, e.nativeEvent.contentSize.height));
          }}
          style={[
            styles.journalInput, 
            { height: inputHeight },
            isJournalFocused && styles.journalInputFocused
          ]}
        />
        
        <View style={styles.journalFooter}>
          <Text style={[
            styles.wordCountText, 
            wordCount >= 80 ? { color: THEME.colors.primary } : { color: THEME.colors.textMuted }
          ]}>
            {wordCount} / 80 words
          </Text>
          <TouchableOpacity 
            onPress={handleNotesSubmit} 
            disabled={!canSave}
            style={[
              styles.saveNotesBtn, 
              !canSave && { backgroundColor: THEME.colors.surface, borderColor: THEME.colors.border, opacity: 0.5 }
            ]}
          >
            <CheckCircle2 size={13} color={canSave ? "#fff" : THEME.colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.saveNotesText, !canSave && { color: THEME.colors.textMuted }]}>
              {notesText.trim() === lastSavedText.trim() ? 'Saved' : 'Save Journal Entry'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* History and Timeline Section */}
      <View style={styles.bottomHistoryCard}>
        <View style={styles.bottomHistoryHeader}>
          <Text style={styles.bottomHistoryTitle}>History Timeline</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity 
              onPress={() => setBottomHistoryMode('7d')} 
              style={[styles.toggleBtn, bottomHistoryMode === '7d' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, bottomHistoryMode === '7d' && styles.toggleBtnTextActive]}>7D</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setBottomHistoryMode('30d')} 
              style={[styles.toggleBtn, bottomHistoryMode === '30d' && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, bottomHistoryMode === '30d' && styles.toggleBtnTextActive]}>30D</Text>
            </TouchableOpacity>
          </View>
        </View>

        {bottomHistoryMode === '30d' && (
          <View style={styles.monthSwitcherRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.monthSwitcherBtn}>
              <ChevronLeft size={18} color={THEME.colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {viewedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity 
              onPress={handleNextMonth} 
              disabled={isNextMonthFuture}
              style={[styles.monthSwitcherBtn, isNextMonthFuture && { opacity: 0.25 }]}
            >
              <ChevronRight size={18} color={THEME.colors.text} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ marginTop: THEME.spacing.sm }}>
          {bottomHistoryMode === '7d' ? render7Days() : renderCalendar()}
        </View>
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
    paddingTop: Platform.OS === 'web' ? THEME.spacing.lg : 44,
    paddingBottom: 120,
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    paddingHorizontal: 4,
  },
  welcomeSubText: {
    color: THEME.colors.primary,
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(16, 185, 129, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  welcomeTitleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  avatarGlowBorder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  dateSwitcherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
  },
  datePillNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  datePillTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.sm,
  },
  datePillText: {
    color: THEME.colors.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.surfaceCard,
  },
  toggleBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: THEME.colors.text,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 0.3,
  },
  scoreCard: {
    padding: THEME.spacing.lg,
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.xl,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scoreTitle: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '800',
    marginVertical: 2,
  },
  scoreBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  liveIndicator: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 10,
  },
  scoreTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorePercentText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  scoreLabelSub: {
    fontSize: 8,
    color: THEME.colors.textMuted,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 0.5,
  },
  categoryCardPurple: {
    backgroundColor: 'rgba(30, 41, 59, 0.70)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryCardGreen: {
    backgroundColor: 'rgba(30, 41, 59, 0.70)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryCardYellow: {
    backgroundColor: 'rgba(30, 41, 59, 0.70)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.xl,
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    marginBottom: THEME.spacing.sm + 2,
    overflow: 'hidden',
    width: '100%',
  },
  miniProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  checklistCapsule: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 1,
    marginVertical: 4,
  },
  checklistCapsuleCompletedPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  checklistCapsuleCompletedGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  checklistCapsuleCompletedYellow: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  graphCard: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.xl,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    padding: THEME.spacing.xl,
  },
  journalCard: {
    padding: THEME.spacing.md,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.xl,
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
    backgroundColor: THEME.colors.background,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    borderRadius: THEME.radius.lg,
    color: '#ffffff',
    padding: THEME.spacing.sm + 2,
    fontSize: 13.5,
    minHeight: 95,
    textAlignVertical: 'top',
  },
  journalInputFocused: {
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  journalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  wordCountText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  saveNotesBtn: {
    backgroundColor: THEME.colors.primary,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: THEME.radius.lg,
    paddingVertical: THEME.spacing.sm - 1,
    paddingHorizontal: THEME.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...THEME.shadows.glowGreen,
  },
  saveNotesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  bottomHistoryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: THEME.radius.xl,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: THEME.spacing.md,
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.sm,
  },
  bottomHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  bottomHistoryTitle: {
    color: THEME.colors.text,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  monthSwitcherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.2,
    padding: 4,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.md,
  },
  monthSwitcherBtn: {
    width: 32,
    height: 32,
    borderRadius: THEME.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    color: THEME.colors.text,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sevenDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  sevenDaysItem: {
    flex: 1,
    marginHorizontal: 3,
    height: 56,
    borderRadius: THEME.radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sevenDaysItemActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  sevenDaysDay: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  sevenDaysDate: {
    color: THEME.colors.text,
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 1,
  },
  sevenDaysScoreBar: {
    position: 'absolute',
    bottom: 4,
    width: '50%',
    height: 2.5,
    borderRadius: 1.25,
  },
  calendarGrid: {
    width: '100%',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
    width: '100%',
    paddingHorizontal: '1.14%',
  },
  weekdayText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    width: '12%',
    textAlign: 'center',
  },
  calendarCellsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarBlankCell: {
    width: '12%',
    height: 38,
    marginHorizontal: '1.14%',
    marginVertical: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarBlankDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  calendarDayCell: {
    width: '12%',
    height: 38,
    marginHorizontal: '1.14%',
    marginVertical: 3,
    borderRadius: THEME.radius.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDayCellActive: {
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  calendarDayText: {
    color: THEME.colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  calendarScoreBar: {
    position: 'absolute',
    bottom: 3,
    width: '50%',
    height: 2.5,
    borderRadius: 1.25,
  },
});
