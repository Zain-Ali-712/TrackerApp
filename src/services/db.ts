import { Platform } from 'react-native';
import { DailyHabit, Meal, OutreachEntry, Project, ProjectLog } from '../types';

let db: any = null;

// Initialize native SQLite database if on native
const getNativeDb = () => {
  if (Platform.OS !== 'web' && !db) {
    const SQLite = require('expo-sqlite');
    db = SQLite.openDatabaseSync('discipline_tracker.db');
  }
  return db;
};

// Default outreach categories
const DEFAULT_CATEGORIES = ['Furniture', 'Medical', 'Property', 'Pet Care', 'Restaurant/Cafe'];

export const DBService = {
  initialize(): void {
    if (Platform.OS === 'web') {
      // Initialize web localStorage tables if empty
      if (!localStorage.getItem('db_daily_habits')) localStorage.setItem('db_daily_habits', JSON.stringify({}));
      if (!localStorage.getItem('db_meals')) localStorage.setItem('db_meals', JSON.stringify([]));
      if (!localStorage.getItem('db_outreach_entries')) localStorage.setItem('db_outreach_entries', JSON.stringify([]));
      if (!localStorage.getItem('db_projects')) localStorage.setItem('db_projects', JSON.stringify([]));
      if (!localStorage.getItem('db_project_logs')) localStorage.setItem('db_project_logs', JSON.stringify([]));
      if (!localStorage.getItem('db_outreach_categories')) {
        localStorage.setItem('db_outreach_categories', JSON.stringify(DEFAULT_CATEGORIES));
      }
      return;
    }

    // Native SQLite setup
    const nativeDb = getNativeDb();
    if (nativeDb) {
      nativeDb.execSync(`
        CREATE TABLE IF NOT EXISTS daily_habits (
          date TEXT PRIMARY KEY,
          wakeup INTEGER DEFAULT 0,
          workout INTEGER DEFAULT 0,
          reading INTEGER DEFAULT 0,
          outreach INTEGER DEFAULT 0,
          project_session_1 INTEGER DEFAULT 0,
          project_session_2 INTEGER DEFAULT 0,
          calories_goal INTEGER DEFAULT 0,
          protein_goal INTEGER DEFAULT 0,
          sleep_8hr INTEGER DEFAULT 0,
          project_implementation INTEGER DEFAULT 0,
          research_learning INTEGER DEFAULT 0,
          nutrition INTEGER DEFAULT 0,
          prayers INTEGER DEFAULT 0,
          scrolling INTEGER DEFAULT 0,
          feeling_improved INTEGER DEFAULT 0,
          score REAL DEFAULT 0,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS meals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          meal_text TEXT,
          calories INTEGER,
          protein INTEGER,
          carbs INTEGER
        );

        CREATE TABLE IF NOT EXISTS outreach_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT,
          category TEXT,
          business_name TEXT,
          website TEXT,
          instagram TEXT,
          facebook TEXT,
          linkedin TEXT,
          twitter TEXT,
          email TEXT
        );

        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          category TEXT,
          tech_stack TEXT,
          amount REAL DEFAULT 0,
          expected_duration TEXT,
          completed INTEGER DEFAULT 0,
          completion_date TEXT,
          total_hours REAL DEFAULT 0,
          total_days INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS project_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          date TEXT,
          hours_worked REAL
        );

        CREATE TABLE IF NOT EXISTS outreach_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE
        );
      `);

      // Add new columns to existing databases if they don't exist yet
      const newCols = [
        'project_implementation',
        'research_learning',
        'nutrition',
        'prayers',
        'scrolling',
        'feeling_improved'
      ];
      for (const col of newCols) {
        try {
          nativeDb.execSync(`ALTER TABLE daily_habits ADD COLUMN ${col} INTEGER DEFAULT 0;`);
        } catch (e) {
          // Ignore error (e.g. column already exists)
        }
      }

      // Seed default categories for native sqlite if empty
      const countRes = nativeDb.getFirstSync('SELECT count(*) as count FROM outreach_categories') as { count: number } | null;
      if (countRes && countRes.count === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          try {
            nativeDb.runSync('INSERT INTO outreach_categories (name) VALUES (?)', cat);
          } catch (e) {
            // Ignored
          }
        }
      }
    }
  },

  // ==========================================
  // HABITS MODULE REPO
  // ==========================================
  getHabit(date: string): DailyHabit {
    if (Platform.OS === 'web') {
      const habits = JSON.parse(localStorage.getItem('db_daily_habits') || '{}');
      if (habits[date]) {
        return {
          ...this.createEmptyHabit(date),
          ...habits[date]
        };
      }
      return this.createEmptyHabit(date);
    }

    const nativeDb = getNativeDb();
    const row = nativeDb.getFirstSync('SELECT * FROM daily_habits WHERE date = ?', date) as any;
    if (row) {
      return {
        date: row.date,
        wakeup: row.wakeup ?? 0,
        workout: row.workout ?? 0,
        reading: row.reading ?? 0,
        outreach: row.outreach ?? 0,
        project_session_1: row.project_session_1 ?? 0,
        project_session_2: row.project_session_2 ?? 0,
        calories_goal: row.calories_goal ?? 0,
        protein_goal: row.protein_goal ?? 0,
        sleep_8hr: row.sleep_8hr ?? 0,
        project_implementation: row.project_implementation ?? 0,
        research_learning: row.research_learning ?? 0,
        nutrition: row.nutrition ?? 0,
        prayers: row.prayers ?? 0,
        scrolling: row.scrolling ?? 0,
        feeling_improved: row.feeling_improved ?? 0,
        score: row.score ?? 0,
        notes: row.notes || undefined,
      };
    }
    return this.createEmptyHabit(date);
  },

  saveHabit(habit: DailyHabit): void {
    if (Platform.OS === 'web') {
      const habits = JSON.parse(localStorage.getItem('db_daily_habits') || '{}');
      habits[habit.date] = habit;
      localStorage.setItem('db_daily_habits', JSON.stringify(habits));
      return;
    }

    const nativeDb = getNativeDb();
    nativeDb.runSync(`
      INSERT INTO daily_habits (
        date, wakeup, workout, reading, outreach, 
        project_session_1, project_session_2, 
        calories_goal, protein_goal, sleep_8hr,
        project_implementation, research_learning, nutrition,
        prayers, scrolling, feeling_improved, score, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        wakeup=excluded.wakeup,
        workout=excluded.workout,
        reading=excluded.reading,
        outreach=excluded.outreach,
        project_session_1=excluded.project_session_1,
        project_session_2=excluded.project_session_2,
        calories_goal=excluded.calories_goal,
        protein_goal=excluded.protein_goal,
        sleep_8hr=excluded.sleep_8hr,
        project_implementation=excluded.project_implementation,
        research_learning=excluded.research_learning,
        nutrition=excluded.nutrition,
        prayers=excluded.prayers,
        scrolling=excluded.scrolling,
        feeling_improved=excluded.feeling_improved,
        score=excluded.score,
        notes=excluded.notes
    `, 
      habit.date, habit.wakeup, habit.workout, habit.reading, habit.outreach,
      habit.project_session_1, habit.project_session_2,
      habit.calories_goal, habit.protein_goal, habit.sleep_8hr,
      habit.project_implementation, habit.research_learning, habit.nutrition,
      habit.prayers, habit.scrolling, habit.feeling_improved, habit.score, habit.notes || null
    );
  },

  getHabitsRange(startDate: string, endDate: string): DailyHabit[] {
    if (Platform.OS === 'web') {
      const habits = JSON.parse(localStorage.getItem('db_daily_habits') || '{}');
      const result: DailyHabit[] = [];
      let current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        if (habits[dateStr]) {
          result.push({
            ...this.createEmptyHabit(dateStr),
            ...habits[dateStr]
          });
        } else {
          result.push(this.createEmptyHabit(dateStr));
        }
        current.setDate(current.getDate() + 1);
      }
      return result;
    }

    const nativeDb = getNativeDb();
    const rows = nativeDb.getAllSync(
      'SELECT * FROM daily_habits WHERE date >= ? AND date <= ? ORDER BY date ASC',
      startDate, endDate
    ) as any[];

    // Build a map of loaded rows
    const loadedMap = new Map<string, DailyHabit>();
    for (const r of rows) {
      loadedMap.set(r.date, {
        date: r.date,
        wakeup: r.wakeup ?? 0,
        workout: r.workout ?? 0,
        reading: r.reading ?? 0,
        outreach: r.outreach ?? 0,
        project_session_1: r.project_session_1 ?? 0,
        project_session_2: r.project_session_2 ?? 0,
        calories_goal: r.calories_goal ?? 0,
        protein_goal: r.protein_goal ?? 0,
        sleep_8hr: r.sleep_8hr ?? 0,
        project_implementation: r.project_implementation ?? 0,
        research_learning: r.research_learning ?? 0,
        nutrition: r.nutrition ?? 0,
        prayers: r.prayers ?? 0,
        scrolling: r.scrolling ?? 0,
        feeling_improved: r.feeling_improved ?? 0,
        score: r.score ?? 0,
        notes: r.notes || undefined,
      });
    }

    // Fill in missing dates to prevent graph breaks
    const result: DailyHabit[] = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (loadedMap.has(dateStr)) {
        result.push(loadedMap.get(dateStr)!);
      } else {
        result.push(this.createEmptyHabit(dateStr));
      }
      current.setDate(current.getDate() + 1);
    }
    return result;
  },

  createEmptyHabit(date: string): DailyHabit {
    return {
      date,
      wakeup: 0,
      workout: 0,
      reading: 0,
      outreach: 0,
      project_session_1: 0,
      project_session_2: 0,
      calories_goal: 0,
      protein_goal: 0,
      sleep_8hr: 0,
      project_implementation: 0,
      research_learning: 0,
      nutrition: 0,
      prayers: 0,
      scrolling: 0,
      feeling_improved: 0,
      score: 0,
    };
  },

  // ==========================================
  // NUTRITION MODULE REPO
  // ==========================================
  getMeals(date: string): Meal[] {
    if (Platform.OS === 'web') {
      const meals = JSON.parse(localStorage.getItem('db_meals') || '[]');
      return meals.filter((m: Meal) => m.date === date);
    }

    const nativeDb = getNativeDb();
    return nativeDb.getAllSync('SELECT * FROM meals WHERE date = ? ORDER BY id ASC', date) as Meal[];
  },

  addMeal(meal: Omit<Meal, 'id'>): Meal {
    if (Platform.OS === 'web') {
      const meals = JSON.parse(localStorage.getItem('db_meals') || '[]');
      const newId = meals.length > 0 ? Math.max(...meals.map((m: any) => m.id)) + 1 : 1;
      const newMeal = { ...meal, id: newId };
      meals.push(newMeal);
      localStorage.setItem('db_meals', JSON.stringify(meals));
      return newMeal;
    }

    const nativeDb = getNativeDb();
    const result = nativeDb.runSync(
      'INSERT INTO meals (date, meal_text, calories, protein, carbs) VALUES (?, ?, ?, ?, ?)',
      meal.date, meal.meal_text, meal.calories, meal.protein, meal.carbs
    );
    return {
      id: result.lastInsertRowId,
      ...meal
    };
  },

  deleteMeal(id: number): void {
    if (Platform.OS === 'web') {
      const meals = JSON.parse(localStorage.getItem('db_meals') || '[]');
      const filtered = meals.filter((m: Meal) => m.id !== id);
      localStorage.setItem('db_meals', JSON.stringify(filtered));
      return;
    }

    const nativeDb = getNativeDb();
    nativeDb.runSync('DELETE FROM meals WHERE id = ?', id);
  },

  getMealsRange(startDate: string, endDate: string): Meal[] {
    if (Platform.OS === 'web') {
      const meals = JSON.parse(localStorage.getItem('db_meals') || '[]');
      return meals.filter((m: Meal) => m.date >= startDate && m.date <= endDate);
    }

    const nativeDb = getNativeDb();
    return nativeDb.getAllSync(
      'SELECT * FROM meals WHERE date >= ? AND date <= ? ORDER BY date ASC, id ASC',
      startDate, endDate
    ) as Meal[];
  },

  // ==========================================
  // OUTREACH MODULE REPO
  // ==========================================
  getOutreachEntries(): OutreachEntry[] {
    if (Platform.OS === 'web') {
      return JSON.parse(localStorage.getItem('db_outreach_entries') || '[]');
    }

    const nativeDb = getNativeDb();
    return nativeDb.getAllSync('SELECT * FROM outreach_entries ORDER BY date DESC, id DESC') as OutreachEntry[];
  },

  addOutreachEntry(entry: Omit<OutreachEntry, 'id'>): OutreachEntry {
    if (Platform.OS === 'web') {
      const entries = JSON.parse(localStorage.getItem('db_outreach_entries') || '[]');
      const newId = entries.length > 0 ? Math.max(...entries.map((e: any) => e.id)) + 1 : 1;
      const newEntry = { ...entry, id: newId };
      entries.push(newEntry);
      localStorage.setItem('db_outreach_entries', JSON.stringify(entries));
      return newEntry;
    }

    const nativeDb = getNativeDb();
    const result = nativeDb.runSync(`
      INSERT INTO outreach_entries (
        date, category, business_name, website, instagram, facebook, linkedin, twitter, email
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, 
      entry.date, entry.category, entry.business_name, entry.website || null,
      entry.instagram || null, entry.facebook || null, entry.linkedin || null,
      entry.twitter || null, entry.email || null
    );
    return {
      id: result.lastInsertRowId,
      ...entry
    };
  },

  getOutreachCategories(): string[] {
    if (Platform.OS === 'web') {
      return JSON.parse(localStorage.getItem('db_outreach_categories') || '[]');
    }

    const nativeDb = getNativeDb();
    const rows = nativeDb.getAllSync('SELECT name FROM outreach_categories ORDER BY name ASC') as { name: string }[];
    return rows.map((r: any) => r.name);
  },

  addOutreachCategory(name: string): void {
    if (Platform.OS === 'web') {
      const cats = JSON.parse(localStorage.getItem('db_outreach_categories') || '[]');
      if (!cats.includes(name)) {
        cats.push(name);
        localStorage.setItem('db_outreach_categories', JSON.stringify(cats));
      }
      return;
    }

    const nativeDb = getNativeDb();
    try {
      nativeDb.runSync('INSERT INTO outreach_categories (name) VALUES (?)', name);
    } catch (e) {
      // Category might already exist, catch unique constraint
    }
  },

  // ==========================================
  // PROJECTS MODULE REPO
  // ==========================================
  getProjects(): Project[] {
    if (Platform.OS === 'web') {
      return JSON.parse(localStorage.getItem('db_projects') || '[]');
    }

    const nativeDb = getNativeDb();
    return nativeDb.getAllSync('SELECT * FROM projects ORDER BY completed ASC, id DESC') as Project[];
  },

  createProject(project: Omit<Project, 'id' | 'total_hours' | 'total_days' | 'completed'>): Project {
    const newProject: Project = {
      ...project,
      completed: 0,
      total_hours: 0,
      total_days: 0,
    };

    if (Platform.OS === 'web') {
      const projects = JSON.parse(localStorage.getItem('db_projects') || '[]');
      const newId = projects.length > 0 ? Math.max(...projects.map((p: any) => p.id)) + 1 : 1;
      const savedProject = { ...newProject, id: newId };
      projects.push(savedProject);
      localStorage.setItem('db_projects', JSON.stringify(projects));
      return savedProject;
    }

    const nativeDb = getNativeDb();
    const result = nativeDb.runSync(
      'INSERT INTO projects (title, category, tech_stack, amount, expected_duration, completed, total_hours, total_days) VALUES (?, ?, ?, ?, ?, 0, 0, 0)',
      project.title, project.category, project.tech_stack, project.amount, project.expected_duration
    );
    return {
      id: result.lastInsertRowId,
      ...newProject
    };
  },

  updateProject(project: Project): void {
    if (Platform.OS === 'web') {
      const projects = JSON.parse(localStorage.getItem('db_projects') || '[]');
      const index = projects.findIndex((p: Project) => p.id === project.id);
      if (index !== -1) {
        projects[index] = project;
        localStorage.setItem('db_projects', JSON.stringify(projects));
      }
      return;
    }

    const nativeDb = getNativeDb();
    nativeDb.runSync(`
      UPDATE projects SET 
        title = ?, 
        category = ?, 
        tech_stack = ?, 
        amount = ?, 
        expected_duration = ?, 
        completed = ?, 
        completion_date = ?, 
        total_hours = ?, 
        total_days = ?
      WHERE id = ?
    `, 
      project.title, project.category, project.tech_stack, project.amount,
      project.expected_duration, project.completed, project.completion_date || null,
      project.total_hours, project.total_days, project.id
    );
  },

  logProjectWork(log: Omit<ProjectLog, 'id'>): ProjectLog {
    if (Platform.OS === 'web') {
      // Save log
      const logs = JSON.parse(localStorage.getItem('db_project_logs') || '[]');
      const newId = logs.length > 0 ? Math.max(...logs.map((l: any) => l.id)) + 1 : 1;
      const newLog = { ...log, id: newId };
      logs.push(newLog);
      localStorage.setItem('db_project_logs', JSON.stringify(logs));

      // Update project total hours
      const projects = JSON.parse(localStorage.getItem('db_projects') || '[]');
      const projIndex = projects.findIndex((p: Project) => p.id === log.project_id);
      if (projIndex !== -1) {
        const project = projects[projIndex];
        project.total_hours += log.hours_worked;

        // Calculate unique days worked for total_days
        const pLogs = logs.filter((l: ProjectLog) => l.project_id === log.project_id);
        const uniqueDays = new Set(pLogs.map((l: ProjectLog) => l.date));
        project.total_days = uniqueDays.size;

        projects[projIndex] = project;
        localStorage.setItem('db_projects', JSON.stringify(projects));
      }

      return newLog;
    }

    const nativeDb = getNativeDb();
    const result = nativeDb.runSync(
      'INSERT INTO project_logs (project_id, date, hours_worked) VALUES (?, ?, ?)',
      log.project_id, log.date, log.hours_worked
    );

    // Update project total hours and total days worked
    const allProjLogs = nativeDb.getAllSync('SELECT * FROM project_logs WHERE project_id = ?', log.project_id) as ProjectLog[];
    const totalHours = allProjLogs.reduce((acc: number, l: ProjectLog) => acc + l.hours_worked, 0);
    const uniqueDays = new Set(allProjLogs.map((l: ProjectLog) => l.date)).size;

    nativeDb.runSync(
      'UPDATE projects SET total_hours = ?, total_days = ? WHERE id = ?',
      totalHours, uniqueDays, log.project_id
    );

    return {
      id: result.lastInsertRowId,
      ...log
    };
  },

  getProjectLogs(projectId: number): ProjectLog[] {
    if (Platform.OS === 'web') {
      const logs = JSON.parse(localStorage.getItem('db_project_logs') || '[]');
      return logs.filter((l: ProjectLog) => l.project_id === projectId).sort((a: any, b: any) => b.date.localeCompare(a.date));
    }

    const nativeDb = getNativeDb();
    return nativeDb.getAllSync('SELECT * FROM project_logs WHERE project_id = ? ORDER BY date DESC, id DESC', projectId) as ProjectLog[];
  },

  getAllProjectLogsRange(startDate: string, endDate: string): ProjectLog[] {
    if (Platform.OS === 'web') {
      const logs = JSON.parse(localStorage.getItem('db_project_logs') || '[]');
      return logs.filter((l: ProjectLog) => l.date >= startDate && l.date <= endDate);
    }

    const nativeDb = getNativeDb();
    return nativeDb.getAllSync('SELECT * FROM project_logs WHERE date >= ? AND date <= ? ORDER BY date ASC', startDate, endDate) as ProjectLog[];
  },

  // ==========================================
  // DATA MANAGEMENT (BACKUP / RESET)
  // ==========================================
  clearAllData(): void {
    if (Platform.OS === 'web') {
      localStorage.removeItem('db_daily_habits');
      localStorage.removeItem('db_meals');
      localStorage.removeItem('db_outreach_entries');
      localStorage.removeItem('db_projects');
      localStorage.removeItem('db_project_logs');
      localStorage.removeItem('db_outreach_categories');
      this.initialize();
      return;
    }

    const nativeDb = getNativeDb();
    nativeDb.execSync(`
      DELETE FROM daily_habits;
      DELETE FROM meals;
      DELETE FROM outreach_entries;
      DELETE FROM projects;
      DELETE FROM project_logs;
      DELETE FROM outreach_categories;
    `);
    // Re-seed default outreach categories
    for (const cat of DEFAULT_CATEGORIES) {
      try {
        nativeDb.runSync('INSERT INTO outreach_categories (name) VALUES (?)', cat);
      } catch (e) {}
    }
  },

  exportBackup(): string {
    const backupData: any = {};
    if (Platform.OS === 'web') {
      backupData.daily_habits = JSON.parse(localStorage.getItem('db_daily_habits') || '{}');
      backupData.meals = JSON.parse(localStorage.getItem('db_meals') || '[]');
      backupData.outreach_entries = JSON.parse(localStorage.getItem('db_outreach_entries') || '[]');
      backupData.projects = JSON.parse(localStorage.getItem('db_projects') || '[]');
      backupData.project_logs = JSON.parse(localStorage.getItem('db_project_logs') || '[]');
      backupData.outreach_categories = JSON.parse(localStorage.getItem('db_outreach_categories') || '[]');
    } else {
      const nativeDb = getNativeDb();
      backupData.daily_habits = nativeDb.getAllSync('SELECT * FROM daily_habits') as any[];
      backupData.meals = nativeDb.getAllSync('SELECT * FROM meals') as any[];
      backupData.outreach_entries = nativeDb.getAllSync('SELECT * FROM outreach_entries') as any[];
      backupData.projects = nativeDb.getAllSync('SELECT * FROM projects') as any[];
      backupData.project_logs = nativeDb.getAllSync('SELECT * FROM project_logs') as any[];
      backupData.outreach_categories = nativeDb.getAllSync('SELECT * FROM outreach_categories') as any[];
    }
    return JSON.stringify(backupData);
  },

  importBackup(backupStr: string): boolean {
    try {
      const data = JSON.parse(backupStr);
      if (Platform.OS === 'web') {
        if (data.daily_habits) localStorage.setItem('db_daily_habits', JSON.stringify(data.daily_habits));
        if (data.meals) localStorage.setItem('db_meals', JSON.stringify(data.meals));
        if (data.outreach_entries) localStorage.setItem('db_outreach_entries', JSON.stringify(data.outreach_entries));
        if (data.projects) localStorage.setItem('db_projects', JSON.stringify(data.projects));
        if (data.project_logs) localStorage.setItem('db_project_logs', JSON.stringify(data.project_logs));
        if (data.outreach_categories) localStorage.setItem('db_outreach_categories', JSON.stringify(data.outreach_categories));
      } else {
        const nativeDb = getNativeDb();
        // Clear existing tables
        this.clearAllData();

        // Daily Habits
        if (data.daily_habits && Array.isArray(data.daily_habits)) {
          for (const row of data.daily_habits) {
            nativeDb.runSync(`
              INSERT OR REPLACE INTO daily_habits (
                date, wakeup, workout, reading, outreach, project_session_1, project_session_2, calories_goal, protein_goal, sleep_8hr,
                project_implementation, research_learning, nutrition, prayers, scrolling, feeling_improved, score, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              row.date, row.wakeup ?? 0, row.workout ?? 0, row.reading ?? 0, row.outreach ?? 0, row.project_session_1 ?? 0, row.project_session_2 ?? 0, row.calories_goal ?? 0, row.protein_goal ?? 0, row.sleep_8hr ?? 0,
              row.project_implementation ?? 0, row.research_learning ?? 0, row.nutrition ?? 0, row.prayers ?? 0, row.scrolling ?? 0, row.feeling_improved ?? 0, row.score ?? 0, row.notes || null
            ]);
          }
        } else if (data.daily_habits && typeof data.daily_habits === 'object') {
          // If stored as an object { YYYY-MM-DD: habit }
          for (const key of Object.keys(data.daily_habits)) {
            const row = data.daily_habits[key];
            nativeDb.runSync(`
              INSERT OR REPLACE INTO daily_habits (
                date, wakeup, workout, reading, outreach, project_session_1, project_session_2, calories_goal, protein_goal, sleep_8hr,
                project_implementation, research_learning, nutrition, prayers, scrolling, feeling_improved, score, notes
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              row.date, row.wakeup ?? 0, row.workout ?? 0, row.reading ?? 0, row.outreach ?? 0, row.project_session_1 ?? 0, row.project_session_2 ?? 0, row.calories_goal ?? 0, row.protein_goal ?? 0, row.sleep_8hr ?? 0,
              row.project_implementation ?? 0, row.research_learning ?? 0, row.nutrition ?? 0, row.prayers ?? 0, row.scrolling ?? 0, row.feeling_improved ?? 0, row.score ?? 0, row.notes || null
            ]);
          }
        }

        // Meals
        if (data.meals && Array.isArray(data.meals)) {
          for (const row of data.meals) {
            nativeDb.runSync(
              'INSERT INTO meals (id, date, meal_text, calories, protein, carbs) VALUES (?, ?, ?, ?, ?, ?)',
              [row.id, row.date, row.meal_text, row.calories, row.protein, row.carbs]
            );
          }
        }

        // Outreach entries
        if (data.outreach_entries && Array.isArray(data.outreach_entries)) {
          for (const row of data.outreach_entries) {
            nativeDb.runSync(`
              INSERT INTO outreach_entries (
                id, date, category, business_name, website, instagram, facebook, linkedin, twitter, email
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [row.id, row.date, row.category, row.business_name, row.website || null, row.instagram || null, row.facebook || null, row.linkedin || null, row.twitter || null, row.email || null]);
          }
        }

        // Projects
        if (data.projects && Array.isArray(data.projects)) {
          for (const row of data.projects) {
            nativeDb.runSync(`
              INSERT INTO projects (
                id, title, category, tech_stack, amount, expected_duration, completed, completion_date, total_hours, total_days
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [row.id, row.title, row.category, row.tech_stack, row.amount, row.expected_duration, row.completed, row.completion_date || null, row.total_hours, row.total_days]);
          }
        }

        // Project logs
        if (data.project_logs && Array.isArray(data.project_logs)) {
          for (const row of data.project_logs) {
            nativeDb.runSync(
              'INSERT INTO project_logs (id, project_id, date, hours_worked) VALUES (?, ?, ?, ?)',
              [row.id, row.project_id, row.date, row.hours_worked]
            );
          }
        }

        // Custom Categories
        if (data.outreach_categories && Array.isArray(data.outreach_categories)) {
          nativeDb.runSync('DELETE FROM outreach_categories');
          for (const row of data.outreach_categories) {
            const name = typeof row === 'string' ? row : row.name;
            try {
              nativeDb.runSync('INSERT INTO outreach_categories (name) VALUES (?)', name);
            } catch (e) {}
          }
        }
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  }
};
