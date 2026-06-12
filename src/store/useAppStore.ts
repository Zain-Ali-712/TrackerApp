import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DBService } from '../services/db';
import { AIService } from '../services/ai';
import { DailyHabit, Meal, OutreachEntry, Project, ProjectLog } from '../types';

interface AppState {
  selectedDate: string; // YYYY-MM-DD
  openaiApiKey: string;
  caloriesGoal: number;
  proteinGoal: number;
  
  // Daily data
  dailyHabit: DailyHabit;
  meals: Meal[];
  
  // Collections
  outreachEntries: OutreachEntry[];
  outreachCategories: string[];
  projects: Project[];
  
  // Status
  isDbInitialized: boolean;
  isAnalyzingMeal: boolean;

  // Actions
  initApp: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setOpenaiApiKey: (key: string) => Promise<void>;
  updateGoals: (calories: number, protein: number) => Promise<void>;
  
  // Habit Actions
  toggleHabit: (habitKey: keyof Omit<DailyHabit, 'date' | 'score' | 'notes'>) => void;
  updateNotes: (notes: string) => void;
  setDailyNotes: (notes: string) => void;
  saveDailyNotes: () => void;
  recalculateHabit: (date: string, baseHabit?: DailyHabit) => DailyHabit;
  
  // Nutrition Actions
  addMeal: (mealText: string) => Promise<void>;
  deleteMeal: (id: number) => void;
  
  // Outreach Actions
  addOutreach: (entry: Omit<OutreachEntry, 'date'>) => void;
  addCategory: (name: string) => void;
  
  // Project Actions
  createProject: (project: Omit<Project, 'id' | 'total_hours' | 'total_days' | 'completed'>) => void;
  logWork: (projectId: number, hours: number) => void;
  toggleProjectComplete: (projectId: number) => void;

  // Tools
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  resetApp: () => void;
}

// Helper to get formatted date string
export const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const useAppStore = create<AppState>((set, get) => ({
  selectedDate: getTodayDateString(),
  openaiApiKey: '',
  caloriesGoal: 2800,
  proteinGoal: 90,
  dailyHabit: DBService.createEmptyHabit(getTodayDateString()),
  meals: [],
  outreachEntries: [],
  outreachCategories: [],
  projects: [],
  isDbInitialized: false,
  isAnalyzingMeal: false,

  initApp: async () => {
    // 1. Initialize SQLite / Web Storage
    DBService.initialize();

    // 2. Load Saved Preferences
    let apiKey = '';
    let calGoal = 2800;
    let protGoal = 90;

    if (Platform.OS === 'web') {
      apiKey = localStorage.getItem('settings_openai_api_key') || '';
      calGoal = Number(localStorage.getItem('settings_calories_goal') || '2800');
      protGoal = Number(localStorage.getItem('settings_protein_goal') || '90');
    } else {
      try {
        apiKey = await SecureStore.getItemAsync('settings_openai_api_key') || '';
        calGoal = Number(await SecureStore.getItemAsync('settings_calories_goal') || '2800');
        protGoal = Number(await SecureStore.getItemAsync('settings_protein_goal') || '90');
      } catch (e) {
        // Fallback to default
      }
    }

    const todayStr = getTodayDateString();

    // 3. Load Date Specific Data
    const habit = DBService.getHabit(todayStr);
    const mealsList = DBService.getMeals(todayStr);
    const outreachList = DBService.getOutreachEntries();
    const categoriesList = DBService.getOutreachCategories();
    const projectsList = DBService.getProjects();

    set({
      openaiApiKey: apiKey,
      caloriesGoal: calGoal,
      proteinGoal: protGoal,
      dailyHabit: habit,
      meals: mealsList,
      outreachEntries: outreachList,
      outreachCategories: categoriesList,
      projects: projectsList,
      isDbInitialized: true,
      selectedDate: todayStr,
    });

    // Re-verify auto nutrition achievements on load
    get().setSelectedDate(todayStr);
  },

  setSelectedDate: (date: string) => {
    if (!get().isDbInitialized) return;

    const baseHabit = DBService.getHabit(date);
    const mealsList = DBService.getMeals(date);
    
    // Automatically recalculate to sync states on load
    const habit = get().recalculateHabit(date, baseHabit);
    DBService.saveHabit(habit);
    
    set({
      selectedDate: date,
      dailyHabit: habit,
      meals: mealsList,
    });
  },

  setOpenaiApiKey: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('settings_openai_api_key', key);
    } else {
      try {
        await SecureStore.setItemAsync('settings_openai_api_key', key);
      } catch (e) {}
    }
    set({ openaiApiKey: key });
  },

  updateGoals: async (calories: number, protein: number) => {
    if (Platform.OS === 'web') {
      localStorage.setItem('settings_calories_goal', String(calories));
      localStorage.setItem('settings_protein_goal', String(protein));
    } else {
      try {
        await SecureStore.setItemAsync('settings_calories_goal', String(calories));
        await SecureStore.setItemAsync('settings_protein_goal', String(protein));
      } catch (e) {}
    }
    
    set({ caloriesGoal: calories, proteinGoal: protein });

    // Recalculate today's habit
    const activeDate = get().selectedDate;
    const updated = get().recalculateHabit(activeDate);
    DBService.saveHabit(updated);
    set({ dailyHabit: updated });
  },

  toggleHabit: (habitKey: keyof Omit<DailyHabit, 'date' | 'score' | 'notes'>) => {
    // Block auto-controlled checkboxes from manual toggle
    if (
      habitKey === 'outreach' ||
      habitKey === 'project_implementation' ||
      habitKey === 'nutrition' ||
      habitKey === 'reading'
    ) {
      return;
    }

    const habit = { ...get().dailyHabit };
    habit[habitKey] = habit[habitKey] === 1 ? 0 : 1;

    // Recalculate and save
    const updated = get().recalculateHabit(get().selectedDate, habit);
    DBService.saveHabit(updated);
    set({ dailyHabit: updated });
  },

  updateNotes: (notes: string) => {
    const habit = { ...get().dailyHabit, notes };
    const updated = get().recalculateHabit(get().selectedDate, habit);
    DBService.saveHabit(updated);
    set({ dailyHabit: updated });
  },

  setDailyNotes: (notes: string) => {
    const habit = { ...get().dailyHabit, notes };
    const updated = get().recalculateHabit(get().selectedDate, habit);
    set({ dailyHabit: updated });
  },

  saveDailyNotes: () => {
    const habit = get().dailyHabit;
    DBService.saveHabit(habit);
  },

  recalculateHabit: (date: string, baseHabit?: DailyHabit) => {
    const habit = baseHabit ? { ...baseHabit } : DBService.getHabit(date);
    
    // 1. Outreach Count from DB
    const outreachEntries = DBService.getOutreachEntries();
    const outreachForDay = outreachEntries.filter(e => e.date === date);
    const outreachCount = outreachForDay.length;
    
    // Outreach checkbox checks if count >= 10
    habit.outreach = outreachCount >= 10 ? 1 : 0;
    
    // 2. Project Hours from DB
    const projectLogs = DBService.getAllProjectLogsRange(date, date);
    const projectHours = projectLogs.reduce((acc, log) => acc + log.hours_worked, 0);
    
    // Project implementation checkbox checks if hours >= 3
    habit.project_implementation = projectHours >= 3 ? 1 : 0;
    
    // 3. Nutrition Goals check
    const meals = DBService.getMeals(date);
    const totalCal = meals.reduce((acc, m) => acc + m.calories, 0);
    const totalProt = meals.reduce((acc, m) => acc + m.protein, 0);
    const calGoal = get().caloriesGoal;
    const protGoal = get().proteinGoal;
    
    // Nutrition checkbox checks if both are met
    habit.nutrition = (totalCal >= calGoal && totalProt >= protGoal) ? 1 : 0;
    
    // Keep legacy goals updated too so they don't break other screens
    habit.calories_goal = totalCal >= calGoal ? 1 : 0;
    habit.protein_goal = totalProt >= protGoal ? 1 : 0;
    
    // Keep legacy project session checkboxes updated as well
    habit.project_session_1 = projectHours > 0 ? 1 : 0;
    habit.project_session_2 = projectHours >= 4 ? 1 : 0;
    
    // 4. Reading/Writing based on journal word count (80+ words)
    const notes = habit.notes || '';
    const cleanNotes = notes.trim();
    const wordCount = cleanNotes ? cleanNotes.split(/\s+/).length : 0;
    habit.reading = wordCount >= 80 ? 1 : 0;
    
    // 5. Total Score calculation
    let score = 0;
    
    // Wake up at 4am: 5%
    if (habit.wakeup === 1) score += 5;
    // Workout: 15%
    if (habit.workout === 1) score += 15;
    // Reading/Writing: 5%
    if (habit.reading === 1) score += 5;
    
    // Outreach: 18% weightage. If count >= 10, scales from 50% to 100% of 18% for 10-20 entries.
    if (outreachCount >= 10) {
      const scalePercent = Math.min(100, 50 + (outreachCount - 10) * 5);
      score += 18 * (scalePercent / 100);
    }
    
    // Project implementation: 12%
    if (habit.project_implementation === 1) score += 12;
    // Research and Learning: 10%
    if (habit.research_learning === 1) score += 10;
    // Nutrition: 14%
    if (habit.nutrition === 1) score += 14;
    // Sleep: 6%
    if (habit.sleep_8hr === 1) score += 6;
    
    // Prayers 5: 5%
    if (habit.prayers === 1) score += 5;
    // Doom/Bloom scrolling: 5%
    if (habit.scrolling === 1) score += 5;
    // Feeling improved: 5%
    if (habit.feeling_improved === 1) score += 5;
    
    habit.score = Math.round(score);
    return habit;
  },

  addMeal: async (mealText: string) => {
    set({ isAnalyzingMeal: true });
    try {
      const activeDate = get().selectedDate;
      const apiKey = get().openaiApiKey;
      
      // Request AI estimate
      const result = await AIService.estimateMeal(mealText, apiKey);
      
      // Save meal to database
      DBService.addMeal({
        date: activeDate,
        meal_text: result.estimatedMealName,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
      });

      // Reload meals
      const updatedMeals = DBService.getMeals(activeDate);

      // Auto update checklist status and score via central recalculateHabit
      const updatedHabit = get().recalculateHabit(activeDate);
      DBService.saveHabit(updatedHabit);

      set({
        meals: updatedMeals,
        dailyHabit: updatedHabit,
        isAnalyzingMeal: false,
      });
    } catch (e) {
      set({ isAnalyzingMeal: false });
      throw e;
    }
  },

  deleteMeal: (id: number) => {
    const activeDate = get().selectedDate;
    DBService.deleteMeal(id);

    const updatedMeals = DBService.getMeals(activeDate);

    // Auto update checklist status and score via central recalculateHabit
    const updatedHabit = get().recalculateHabit(activeDate);
    DBService.saveHabit(updatedHabit);

    set({
      meals: updatedMeals,
      dailyHabit: updatedHabit,
    });
  },

  addOutreach: (entry: Omit<OutreachEntry, 'date'>) => {
    const activeDate = get().selectedDate;
    DBService.addOutreachEntry({
      date: activeDate,
      ...entry,
    });

    // Automatically check Outreach and recalculate score
    const updatedHabit = get().recalculateHabit(activeDate);
    DBService.saveHabit(updatedHabit);

    const updatedOutreach = DBService.getOutreachEntries();
    set({
      outreachEntries: updatedOutreach,
      dailyHabit: updatedHabit,
    });
  },

  addCategory: (name: string) => {
    DBService.addOutreachCategory(name);
    const list = DBService.getOutreachCategories();
    set({ outreachCategories: list });
  },

  createProject: (project: Omit<Project, 'id' | 'total_hours' | 'total_days' | 'completed'>) => {
    DBService.createProject(project);
    const list = DBService.getProjects();
    set({ projects: list });
  },

  logWork: (projectId: number, hours: number) => {
    const activeDate = get().selectedDate;
    DBService.logProjectWork({
      project_id: projectId,
      date: activeDate,
      hours_worked: hours,
    });

    // Recalculate checklist and score
    const updatedHabit = get().recalculateHabit(activeDate);
    DBService.saveHabit(updatedHabit);

    const projectsList = DBService.getProjects();
    set({
      projects: projectsList,
      dailyHabit: updatedHabit,
    });
  },

  toggleProjectComplete: (projectId: number) => {
    const projectsList = get().projects;
    const index = projectsList.findIndex(p => p.id === projectId);
    if (index !== -1) {
      const project = { ...projectsList[index] };
      const nowStr = getTodayDateString();
      project.completed = project.completed === 1 ? 0 : 1;
      project.completion_date = project.completed === 1 ? nowStr : undefined;
      
      DBService.updateProject(project);
      set({ projects: DBService.getProjects() });
    }
  },

  exportData: () => {
    return DBService.exportBackup();
  },

  importData: (jsonStr: string) => {
    const result = DBService.importBackup(jsonStr);
    if (result) {
      // Refresh current states
      const activeDate = get().selectedDate;
      set({
        dailyHabit: DBService.getHabit(activeDate),
        meals: DBService.getMeals(activeDate),
        outreachEntries: DBService.getOutreachEntries(),
        outreachCategories: DBService.getOutreachCategories(),
        projects: DBService.getProjects(),
      });
    }
    return result;
  },

  resetApp: () => {
    DBService.clearAllData();
    const todayStr = getTodayDateString();
    set({
      dailyHabit: DBService.getHabit(todayStr),
      meals: DBService.getMeals(todayStr),
      outreachEntries: DBService.getOutreachEntries(),
      outreachCategories: DBService.getOutreachCategories(),
      projects: DBService.getProjects(),
      selectedDate: todayStr,
    });
  }
}));
