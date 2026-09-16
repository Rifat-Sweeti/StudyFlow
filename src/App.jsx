import { useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import { auth, db } from "./firebase";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">
          <img src="/images/logo.png" alt="StudyNest logo" />
        </div>
        <h2>StudyNest</h2>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <StudyNest user={user} />;
}

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        if (!name.trim()) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }

        const result = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await updateProfile(result.user, {
          displayName: name.trim()
        });

        setMessage("Account created successfully!");
      }
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account already exists with this email.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message);
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Your browser blocked the Google sign-in window.");
      } else if (
        err.code === "auth/account-exists-with-different-credential"
      ) {
        setError(
          "An account already exists with this email using another sign-in method."
        );
      } else if (err.code === "auth/network-request-failed") {
        setError(
          "Network error. Please check your internet connection."
        );
      } else {
        setError(err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">
            <img
              src="images\logo.png"
              alt="StudyNest logo"
              className="logo"
            />
          </div>

          <div>
            <h1>StudyNest</h1>
            <p>Student Planner</p>
          </div>
        </div>

        <div className="auth-hero">
          <span className="auth-tag">YOUR PERSONAL STUDY SPACE</span>

          <h2>
            Plan your work.
            <br />
            <span>Focus on what matters.</span>
          </h2>

          <p>
            StudyNest helps you organize your tasks, stay focused,
            track your progress, and make your study days easier.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="feature-icon">✓</div>

              <div>
                <strong>Organize your tasks</strong>
                <span>Keep your daily work in one place.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-icon">◷</div>

              <div>
                <strong>Stay focused</strong>
                <span>Use the focus timer to study without distractions.</span>
              </div>
            </div>

            <div className="auth-feature">
              <div className="feature-icon">↗</div>

              <div>
                <strong>Track your progress</strong>
                <span>See how much you have completed.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          <span>StudyNest</span>
          <span>•</span>
          <span>Student Productivity</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-brand-mobile">
          <div className="auth-mobile-logo">
            <img
              src="/images/logo.png"
              alt="StudyNest logo"
              className="logo"
            />
          </div>

          <div>
            <h1>StudyNest</h1>
            <p>Student Planner</p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>
              {mode === "login"
                ? "Welcome back!"
                : "Create your account"}
            </h2>

            <p>
              {mode === "login"
                ? "Sign in to continue to your workspace."
                : "Create your StudyNest account and get organized."}
            </p>
          </div>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message success">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="form-group">
                <label>Your name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label>Email address</label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <span className="google-icon">G</span>
            Continue with Google
          </button>

          <div className="auth-switch">
            <span>
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setMessage("");
              }}
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudyNest({ user }) {
  const [activePage, setActivePage] = useState("Dashboard");

  const [tasks, setTasks] = useState([]);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("Study");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDate, setTaskDate] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [timer, setTimer] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusSessions, setFocusSessions] = useState(0);

  const [taskLoading, setTaskLoading] = useState(false);

  useEffect(() => {
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const loadedTasks = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data()
        }));

        loadedTasks.sort((a, b) => {
          const first = a.createdAt || 0;
          const second = b.createdAt || 0;

          return second - first;
        });

        setTasks(loadedTasks);
      },
      (error) => {
        console.error("Error loading tasks:", error);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((current) => {
        if (current <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          setFocusSessions((value) => value + 1);

          return 25 * 60;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  const addTask = async (e) => {
    e.preventDefault();

    if (!taskTitle.trim()) {
      return;
    }

    setTaskLoading(true);

    try {
      await addDoc(collection(db, "tasks"), {
        title: taskTitle.trim(),
        subject: taskSubject,
        priority: taskPriority,
        dueDate: taskDate,
        completed: false,
        userId: user.uid,
        createdAt: Date.now()
      });

      setTaskTitle("");
      setTaskSubject("Study");
      setTaskPriority("Medium");
      setTaskDate("");
    } catch (error) {
      console.error("Error adding task:", error);
    }

    setTaskLoading(false);
  };

  const toggleTask = async (task) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        completed: !task.completed
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const clearCompleted = async () => {
    const completedTasks = tasks.filter((task) => task.completed);

    try {
      for (const task of completedTasks) {
        await deleteDoc(doc(db, "tasks", task.id));
      }
    } catch (error) {
      console.error("Error clearing completed tasks:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = tasks.filter(
    (task) => !task.completed
  ).length;

  const highPriorityTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.priority &&
      task.priority.toLowerCase() === "high"
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedTasks / tasks.length) * 100);

  const today = new Date().toISOString().split("T")[0];

  const todayTasks = tasks.filter(
    (task) => task.dueDate === today
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    let matchesFilter = true;

    if (filter === "Pending") {
      matchesFilter = !task.completed;
    }

    if (filter === "Completed") {
      matchesFilter = task.completed;
    }

    if (filter === "High Priority") {
      matchesFilter =
        !task.completed &&
        task.priority &&
        task.priority.toLowerCase() === "high";
    }

    return matchesSearch && matchesFilter;
  });

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const remainingSeconds = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimer(25 * 60);
  };

  const goTo = (page) => {
    setActivePage(page);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-icon">
              <img
                src="images\logo.png"
                alt="StudyNest logo"
                className="logo"
              />
            </div>

            <div>
              <h2>StudyNest</h2>
              <span>Student Planner</span>
            </div>
          </div>

          <div className="user-profile">
            <div className="user-avatar">
              {(user.displayName ||
                user.email ||
                "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-info">
              <strong>
                {user.displayName || "Student"}
              </strong>

              <span>{user.email}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${
                activePage === "Dashboard" ? "active" : ""
              }`}
              onClick={() => goTo("Dashboard")}
            >
              <span className="nav-icon">⌂</span>
              Dashboard
            </button>

            <button
              className={`nav-item ${
                activePage === "My Tasks" ? "active" : ""
              }`}
              onClick={() => goTo("My Tasks")}
            >
              <span className="nav-icon">✓</span>
              My Tasks
            </button>

            <button
              className={`nav-item ${
                activePage === "Focus" ? "active" : ""
              }`}
              onClick={() => goTo("Focus")}
            >
              <span className="nav-icon">◷</span>
              Focus
            </button>

            <button
              className={`nav-item ${
                activePage === "Progress" ? "active" : ""
              }`}
              onClick={() => goTo("Progress")}
            >
              <span className="nav-icon">↗</span>
              Progress
            </button>

            <button
              className={`nav-item ${
                activePage === "About" ? "active" : ""
              }`}
              onClick={() => goTo("About")}
            >
              <span className="nav-icon">i</span>
              About
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={logout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-page">
            <span className="topbar-label">
              {activePage}
            </span>
          </div>

          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric"
              })}
            </span>
          </div>
        </header>

        {activePage === "Dashboard" && (
          <Dashboard
            user={user}
            tasks={tasks}
            todayTasks={todayTasks}
            completedTasks={completedTasks}
            pendingTasks={pendingTasks}
            highPriorityTasks={highPriorityTasks}
            progress={progress}
            goTo={goTo}
          />
        )}

        {activePage === "My Tasks" && (
          <TasksPage
            taskTitle={taskTitle}
            setTaskTitle={setTaskTitle}
            taskSubject={taskSubject}
            setTaskSubject={setTaskSubject}
            taskPriority={taskPriority}
            setTaskPriority={setTaskPriority}
            taskDate={taskDate}
            setTaskDate={setTaskDate}
            addTask={addTask}
            taskLoading={taskLoading}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            filteredTasks={filteredTasks}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            clearCompleted={clearCompleted}
          />
        )}

        {activePage === "Focus" && (
          <FocusPage
            timer={timer}
            timerRunning={timerRunning}
            setTimerRunning={setTimerRunning}
            resetTimer={resetTimer}
            focusSessions={focusSessions}
            formatTime={formatTime}
          />
        )}

        {activePage === "Progress" && (
          <ProgressPage
            tasks={tasks}
            completedTasks={completedTasks}
            pendingTasks={pendingTasks}
            progress={progress}
          />
        )}

        {activePage === "About" && <AboutPage />}

        <footer className="app-footer">
          <span>StudyNest</span>
          <span>Your personal student workspace</span>
        </footer>
      </main>
    </div>
  );
}

function Dashboard({
  user,
  tasks,
  todayTasks,
  completedTasks,
  pendingTasks,
  highPriorityTasks,
  progress,
  goTo
}) {
  return (
    <div className="page">
      <section className="welcome-section">
        <span className="eyebrow">DASHBOARD</span>

        <h1>
          Welcome back, {user.displayName || "Student"}!
        </h1>

        <p>
          Here's a quick look at your study and task progress.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">✓</div>

          <div className="stat-content">
            <span>Completed</span>
            <strong>{completedTasks}</strong>
            <small>Tasks finished</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">○</div>

          <div className="stat-content">
            <span>Pending</span>
            <strong>{pendingTasks}</strong>
            <small>Tasks remaining</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">!</div>

          <div className="stat-content">
            <span>High Priority</span>
            <strong>{highPriorityTasks}</strong>
            <small>Needs attention</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↗</div>

          <div className="stat-content">
            <span>Progress</span>
            <strong>{progress}%</strong>
            <small>Overall completion</small>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">TODAY</span>
              <h2>Today's Tasks</h2>
            </div>

            <button
              className="text-button"
              onClick={() => goTo("My Tasks")}
            >
              View all
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <strong>No tasks for today</strong>
              <p>Your schedule is clear for today.</p>
            </div>
          ) : (
            <div className="dashboard-task-list">
              {todayTasks.slice(0, 5).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => {}}
                  onDelete={() => {}}
                  dashboard
                />
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-card progress-card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">PROGRESS</span>
              <h2>Task Progress</h2>
            </div>
          </div>

          <div className="progress-ring-container">
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(
                  #48AE61 ${progress * 3.6}deg,
                  #EEF8EA ${progress * 3.6}deg
                )`
              }}
            >
              <div className="progress-ring-inner">
                <strong>{progress}%</strong>
                <span>completed</span>
              </div>
            </div>
          </div>

          <div className="progress-summary">
            <div>
              <strong>{completedTasks}</strong>
              <span>Done</span>
            </div>

            <div>
              <strong>{pendingTasks}</strong>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-actions">
        <div className="section-heading">
          <span className="eyebrow">QUICK ACTIONS</span>
          <h2>What would you like to do?</h2>
        </div>

        <div className="quick-action-grid">
          <button
            className="quick-action"
            onClick={() => goTo("My Tasks")}
          >
            <div className="quick-icon">+</div>

            <div>
              <strong>Add a task</strong>
              <span>Create something new to work on.</span>
            </div>
          </button>

          <button
            className="quick-action"
            onClick={() => goTo("Focus")}
          >
            <div className="quick-icon">◷</div>

            <div>
              <strong>Start focus</strong>
              <span>Begin a focused study session.</span>
            </div>
          </button>

          <button
            className="quick-action"
            onClick={() => goTo("Progress")}
          >
            <div className="quick-icon">↗</div>

            <div>
              <strong>View progress</strong>
              <span>Check your current progress.</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}

function TasksPage({
  taskTitle,
  setTaskTitle,
  taskSubject,
  setTaskSubject,
  taskPriority,
  setTaskPriority,
  taskDate,
  setTaskDate,
  addTask,
  taskLoading,
  search,
  setSearch,
  filter,
  setFilter,
  filteredTasks,
  toggleTask,
  deleteTask,
  clearCompleted
}) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">MY TASKS</span>

          <h1>Stay organized.</h1>

          <p>
            Add, manage, and complete your study tasks.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={clearCompleted}
        >
          Clear completed
        </button>
      </div>

      <div className="add-task-card">
        <form className="task-form" onSubmit={addTask}>
          <div className="task-input-main">
            <label>Task title</label>

            <input
              type="text"
              placeholder="What do you need to get done?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </div>

          <div className="task-form-row">
            <div className="form-group">
              <label>Subject</label>

              <select
                value={taskSubject}
                onChange={(e) =>
                  setTaskSubject(e.target.value)
                }
              >
                <option>Study</option>
                <option>Mathematics</option>
                <option>Science</option>
                <option>English</option>
                <option>Coding</option>
                <option>Personal</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>

              <select
                value={taskPriority}
                onChange={(e) =>
                  setTaskPriority(e.target.value)
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due date</label>

              <input
                type="date"
                value={taskDate}
                onChange={(e) =>
                  setTaskDate(e.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="add-task-button"
              disabled={taskLoading}
            >
              {taskLoading ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>

      <section className="tasks-section">
        <div className="task-toolbar">
          <div className="filter-buttons">
            {[
              "All",
              "Pending",
              "Completed",
              "High Priority"
            ].map((item) => (
              <button
                key={item}
                className={`filter-button ${
                  filter === item ? "active" : ""
                }`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <strong>No tasks found</strong>
              <p>
                Add a task or change your search/filter.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  dashboard = false
}) {
  return (
    <div
      className={`task-row ${
        task.completed ? "completed" : ""
      }`}
    >
      <button
        className={`task-check ${
          task.completed ? "checked" : ""
        }`}
        onClick={onToggle}
      >
        {task.completed ? "✓" : ""}
      </button>

      <div className="task-details">
        <strong>{task.title}</strong>

        <div className="task-meta">
          <span>{task.subject}</span>

          {task.dueDate && (
            <span>
              Due{" "}
              {new Date(
                `${task.dueDate}T00:00:00`
              ).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {!dashboard && (
        <>
          <span
            className={`priority priority-${(
              task.priority || "medium"
            ).toLowerCase()}`}
          >
            {task.priority || "Medium"}
          </span>

          <button
            className="delete-task"
            onClick={onDelete}
            title="Delete task"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

function FocusPage({
  timer,
  timerRunning,
  setTimerRunning,
  resetTimer,
  focusSessions,
  formatTime
}) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">FOCUS</span>

          <h1>Time to focus.</h1>

          <p>
            Give yourself 25 minutes of distraction-free study.
          </p>
        </div>
      </div>

      <div className="focus-layout">
        <div className="focus-card">
          <span className="focus-label">
            FOCUS SESSION
          </span>

          <div className="focus-timer">
            {formatTime(timer)}
          </div>

          <div className="focus-controls">
            <button
              className="focus-start"
              onClick={() =>
                setTimerRunning(!timerRunning)
              }
            >
              {timerRunning ? "Pause" : "Start"}
            </button>

            <button
              className="focus-reset"
              onClick={resetTimer}
            >
              Reset
            </button>
          </div>

          <div className="focus-session">
            <strong>{focusSessions}</strong>
            <span>Sessions completed</span>
          </div>
        </div>

        <div className="tips-card">
          <span className="eyebrow">FOCUS TIPS</span>

          <h2>
            Small focused sessions can make studying easier.
          </h2>

          <div className="tip">
            <span>01</span>

            <div>
              <strong>Choose one task</strong>

              <p>
                Focus on one clear task instead of trying to
                do everything at once.
              </p>
            </div>
          </div>

          <div className="tip">
            <span>02</span>

            <div>
              <strong>Remove distractions</strong>

              <p>
                Put away anything that might interrupt your
                study session.
              </p>
            </div>
          </div>

          <div className="tip">
            <span>03</span>

            <div>
              <strong>Take a short break</strong>

              <p>
                Give yourself a little time to rest after a
                focused session.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressPage({
  tasks,
  completedTasks,
  pendingTasks,
  progress
}) {
  const subjects = [
    "Mathematics",
    "Science",
    "English",
    "Coding",
    "Study",
    "Personal"
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PROGRESS</span>

          <h1>See how you're doing.</h1>

          <p>
            Your progress is based on the tasks you complete.
          </p>
        </div>
      </div>

      <section className="progress-overview">
        <div className="big-progress-card">
          <span className="eyebrow">OVERALL PROGRESS</span>

          <h2>{progress}%</h2>

          <p>
            {completedTasks} of {tasks.length} tasks completed
          </p>

          <div className="progress-bar-large">
            <div
              style={{
                width: `${progress}%`
              }}
            ></div>
          </div>
        </div>

        <div className="progress-number-card">
          <strong>{completedTasks}</strong>
          <span>Completed</span>
        </div>

        <div className="progress-number-card">
          <strong>{pendingTasks}</strong>
          <span>Remaining</span>
        </div>
      </section>

      <section className="subject-progress">
        <div className="section-heading">
          <span className="eyebrow">SUBJECTS</span>
          <h2>Task distribution</h2>
        </div>

        <div className="subject-list">
          {subjects.map((subject) => {
            const subjectTasks = tasks.filter(
              (task) => task.subject === subject
            );

            const subjectCompleted = subjectTasks.filter(
              (task) => task.completed
            ).length;

            const subjectProgress =
              subjectTasks.length === 0
                ? 0
                : Math.round(
                    (subjectCompleted /
                      subjectTasks.length) *
                      100
                  );

            return (
              <div
                className="subject-row"
                key={subject}
              >
                <div className="subject-name">
                  <strong>{subject}</strong>

                  <span>
                    {subjectTasks.length}{" "}
                    {subjectTasks.length === 1
                      ? "task"
                      : "tasks"}
                  </span>
                </div>

                <div className="subject-progress-bar">
                  <div
                    style={{
                      width: `${subjectProgress}%`
                    }}
                  ></div>
                </div>

                <div className="subject-percent">
                  {subjectProgress}%
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="page">
      <section className="about-hero">
        <span className="eyebrow">
          ABOUT STUDYNEST
        </span>

        <h1>
          A simpler way to
          <br />
          manage your study life.
        </h1>

        <p>
          StudyNest is a personal student productivity
          workspace designed to help you organize tasks,
          focus on your work, and keep track of your progress
          in one simple place.
        </p>
      </section>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-card-icon">✓</div>

          <h3>Task Management</h3>

          <p>
            Create tasks, set priorities, add due dates, and
            keep track of what needs to be completed.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card-icon">◷</div>

          <h3>Focus Timer</h3>

          <p>
            Use focused 25-minute sessions to give your study
            time more structure.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card-icon">↗</div>

          <h3>Progress Tracking</h3>

          <p>
            See your completed and pending tasks and get a
            simple view of your overall progress.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card-icon">☁</div>

          <h3>Your Workspace</h3>

          <p>
            Your tasks are connected to your own account and
            stored in Firestore.
          </p>
        </div>
      </section>

      <section className="how-section">
        <div className="section-heading">
          <span className="eyebrow">HOW IT WORKS</span>

          <h2>Simple from start to finish.</h2>
        </div>

        <div className="how-grid">
          <div className="how-step">
            <span>01</span>

            <h3>Add your tasks</h3>

            <p>
              Add schoolwork, coding practice, personal tasks,
              or anything else you need to remember.
            </p>
          </div>

          <div className="how-step">
            <span>02</span>

            <h3>Work with focus</h3>

            <p>
              Choose a task and use the focus timer to stay
              focused on the work in front of you.
            </p>
          </div>

          <div className="how-step">
            <span>03</span>

            <h3>Track your progress</h3>

            <p>
              Complete your tasks and watch your progress grow
              over time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;