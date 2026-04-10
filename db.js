import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '.data');
const TASKS_FILE = path.join(DB_DIR, 'tasks.json');
const FEEDBACK_FILE = path.join(DB_DIR, 'feedback.json');
const WEEKLY_PLANS_FILE = path.join(DB_DIR, 'weekly_plans.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initializeFiles = () => {
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(FEEDBACK_FILE)) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(WEEKLY_PLANS_FILE)) {
    fs.writeFileSync(WEEKLY_PLANS_FILE, JSON.stringify([], null, 2));
  }
};

initializeFiles();

// Task operations
export const db = {
  // Tasks
  getTasks: (limit = 50) => {
    try {
      const data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
      return data.slice(-limit).reverse();
    } catch {
      return [];
    }
  },

  addTask: (task) => {
    try {
      const data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
      data.push(task);
      fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
      return task;
    } catch (error) {
      console.error('Error adding task:', error);
      return null;
    }
  },

  getAllTasks: () => {
    try {
      return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  },

  // Feedback
  getFeedback: () => {
    try {
      return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
    } catch {
      return [];
    }
  },

  addFeedback: (feedback) => {
    try {
      const data = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
      data.push(feedback);
      fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2));
      return feedback;
    } catch (error) {
      console.error('Error adding feedback:', error);
      return null;
    }
  },

  // Weekly Plans
  getWeeklyPlans: () => {
    try {
      return JSON.parse(fs.readFileSync(WEEKLY_PLANS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  },

  addWeeklyPlan: (plan) => {
    try {
      const data = JSON.parse(fs.readFileSync(WEEKLY_PLANS_FILE, 'utf-8'));
      data.push(plan);
      fs.writeFileSync(WEEKLY_PLANS_FILE, JSON.stringify(data, null, 2));
      return plan;
    } catch (error) {
      console.error('Error adding weekly plan:', error);
      return null;
    }
  },

  // Stats
  getStats: () => {
    try {
      const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
      const crystalCount = tasks.filter(t => t.classification === 'crystal').length;
      const bouncyCount = tasks.filter(t => t.classification === 'bouncy').length;
      const avgConfidence = tasks.length > 0
        ? (tasks.reduce((sum, t) => sum + (t.confidence || 0), 0) / tasks.length).toFixed(2)
        : 0;

      return {
        totalTasks: tasks.length,
        crystal: crystalCount,
        bouncy: bouncyCount,
        avgAccuracy: (parseFloat(avgConfidence) * 100).toFixed(1)
      };
    } catch {
      return {
        totalTasks: 0,
        crystal: 0,
        bouncy: 0,
        avgAccuracy: 0
      };
    }
  }
};
