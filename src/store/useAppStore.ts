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

    const habit = DBService.getHabit(date);
    const mealsList = DBService.getMeals(date);
    
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

    // Recheck today's nutrition status under new goals
    const activeDate = get().selectedDate;
    const meals = DBService.getMeals(activeDate);
    const totals = meals.reduce(
      (acc, m) => ({ cal: acc.cal + m.calories, prot: acc.prot + m.protein }),
      { cal: 0, prot: 0 }
    );

    const habit = { ...get().dailyHabit };
    habit.calories_goal = totals.cal >= calories ? 1 : 0;
    habit.protein_goal = totals.prot >= protein ? 1 : 0;

    // Recalculate score
    const totalHabits = [
      habit.wakeup, habit.workout, habit.reading, habit.outreach,
      habit.project_session_1, habit.project_session_2,
      habit.calories_goal, habit.protein_goal, habit.sleep_8hr
    ];
    const completed = totalHabits.filter(h => h === 1).length;
    habit.score = Math.round((completed / totalHabits.length) * 100);

    DBService.saveHabit(habit);
    set({ dailyHabit: habit });
  },

  toggleHabit: (habitKey: keyof Omit<DailyHabit, 'date' | 'score' | 'notes'>) => {
    const habit = { ...get().dailyHabit };
    habit[habitKey] = habit[habitKey] === 1 ? 0 : 1;

    // Calculate score
    const totalHabits = [
      habit.wakeup, habit.workout, habit.reading, habit.outreach,
      habit.project_session_1, habit.project_session_2,
      habit.calories_goal, habit.protein_goal, habit.sleep_8hr
    ];
    const completed = totalHabits.filter(h => h === 1).length;
    habit.score = Math.round((completed / totalHabits.length) * 100);

    DBService.saveHabit(habit);
    set({ dailyHabit: habit });
  },

  updateNotes: (notes: string) => {
    const habit = { ...get().dailyHabit, notes };
    DBService.saveHabit(habit);
    set({ dailyHabit: habit });
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

      // Auto update Calorie/Protein Goals completed status
      const totalCal = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
      const totalProt = updatedMeals.reduce((sum, m) => sum + m.protein, 0);

      const habit = { ...get().dailyHabit };
      habit.calories_goal = totalCal >= get().caloriesGoal ? 1 : 0;
      habit.protein_goal = totalProt >= get().proteinGoal ? 1 : 0;

      // Recalculate score
      const totalHabits = [
        habit.wakeup, habit.workout, habit.reading, habit.outreach,
        habit.project_session_1, habit.project_session_2,
        habit.calories_goal, habit.protein_goal, habit.sleep_8hr
      ];
      const completed = totalHabits.filter(h => h === 1).length;
      habit.score = Math.round((completed / totalHabits.length) * 100);

      DBService.saveHabit(habit);

      set({
        meals: updatedMeals,
        dailyHabit: habit,
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

    // Recheck goals achievements
    const totalCal = updatedMeals.reduce((sum, m) => sum + m.calories, 0);
    const totalProt = updatedMeals.reduce((sum, m) => sum + m.protein, 0);

    const habit = { ...get().dailyHabit };
    habit.calories_goal = totalCal >= get().caloriesGoal ? 1 : 0;
    habit.protein_goal = totalProt >= get().proteinGoal ? 1 : 0;

    // Recalculate score
    const totalHabits = [
      habit.wakeup, habit.workout, habit.reading, habit.outreach,
      habit.project_session_1, habit.project_session_2,
      habit.calories_goal, habit.protein_goal, habit.sleep_8hr
    ];
    const completed = totalHabits.filter(h => h === 1).length;
    habit.score = Math.round((completed / totalHabits.length) * 100);

    DBService.saveHabit(habit);

    set({
      meals: updatedMeals,
      dailyHabit: habit,
    });
  },

  addOutreach: (entry: Omit<OutreachEntry, 'date'>) => {
    const activeDate = get().selectedDate;
    DBService.addOutreachEntry({
      date: activeDate,
      ...entry,
    });

    // Automatically check "Outreach" habit if user logs an outreach entry today!
    const habit = { ...get().dailyHabit };
    if (habit.outreach === 0) {
      habit.outreach = 1;
      // Recalculate score
      const totalHabits = [
        habit.wakeup, habit.workout, habit.reading, habit.outreach,
        habit.project_session_1, habit.project_session_2,
        habit.calories_goal, habit.protein_goal, habit.sleep_8hr
      ];
      const completed = totalHabits.filter(h => h === 1).length;
      habit.score = Math.round((completed / totalHabits.length) * 100);
      DBService.saveHabit(habit);
    }

    const updatedOutreach = DBService.getOutreachEntries();
    set({
      outreachEntries: updatedOutreach,
      dailyHabit: habit,
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

    // Auto complete "Project Work Session 1" or "Project Work Session 2" based on daily logged work hours!
    // If hours > 0, check Session 1. If hours >= 4 (or another log exists), check Session 2.
    const habit = { ...get().dailyHabit };
    let scoreChanged = false;
    
    if (habit.project_session_1 === 0) {
      habit.project_session_1 = 1;
      scoreChanged = true;
    } else if (habit.project_session_2 === 0) {
      // If session 1 is already checked, check session 2 on second log or if logged hours are high
      habit.project_session_2 = 1;
      scoreChanged = true;
    }

    if (scoreChanged) {
      // Recalculate score
      const totalHabits = [
        habit.wakeup, habit.workout, habit.reading, habit.outreach,
        habit.project_session_1, habit.project_session_2,
        habit.calories_goal, habit.protein_goal, habit.sleep_8hr
      ];
      const completed = totalHabits.filter(h => h === 1).length;
      habit.score = Math.round((completed / totalHabits.length) * 100);
      DBService.saveHabit(habit);
    }

    const projectsList = DBService.getProjects();
    set({
      projects: projectsList,
      dailyHabit: habit,
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
