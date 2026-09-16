import { useEffect, useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut
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
      <div className="auth-loading">
        <div className="loading-logo">✦</div>
        <h2>StudyFlow</h2>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <StudyFlow user={user} />;
}


/* =====================================================
   AUTHENTICATION
===================================================== */

function AuthPage() {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (name.trim() === "") {
          throw new Error("Please enter your name.");
        }

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(result.user, {
          displayName: name
        });

        setMessage("Your StudyFlow account has been created!");
      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.");
      } else {
        setError(err.message);
      }
    }

    setLoading(false);
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setMessage("");
  }

  return (
    <div className="auth-page">

      <div className="auth-left">

        <div className="auth-brand">
          <div className="brand-icon">✦</div>

          <div>
            <strong>StudyFlow</strong>
            <span>Student productivity</span>
          </div>
        </div>

        <div className="auth-content">

          <p className="eyebrow">
            YOUR PERSONAL WORKSPACE
          </p>

          <h1>
            Plan smarter.
            <br />
            <span>Study better.</span>
          </h1>

          <p className="auth-description">
            Organize your tasks, stay focused and track
            your progress — all in one simple workspace.
          </p>

          <div className="auth-features">

            <div>
              <span>✓</span>
              <p>Manage your daily tasks</p>
            </div>

            <div>
              <span>◷</span>
              <p>Focus with study sessions</p>
            </div>

            <div>
              <span>↗</span>
              <p>Track your progress</p>
            </div>

          </div>

        </div>

        <div className="auth-footer">
          StudyFlow · Built for students
        </div>

      </div>


      <div className="auth-right">

        <div className="auth-card">

          <div className="auth-card-heading">

            <div className="mobile-auth-logo">
              ✦
            </div>

            <h2>
              {mode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p>
              {mode === "login"
                ? "Log in to continue to your workspace."
                : "Start organizing your study life today."}
            </p>

          </div>


          <form onSubmit={handleSubmit}>

            {mode === "signup" && (
              <div className="form-group">

                <label>Your name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                />

              </div>
            )}


            <div className="form-group">

              <label>Email address</label>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />

            </div>


            <div className="form-group">

              <label>Password</label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />

            </div>


            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            {message && (
              <div className="auth-success">
                {message}
              </div>
            )}


            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : "Create account"}
            </button>

          </form>


          <div className="auth-switch">

            <span>
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button onClick={switchMode}>
              {mode === "login"
                ? "Create one"
                : "Log in"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   MAIN APP
===================================================== */

function StudyFlow({ user }) {
  const [activePage, setActivePage] = useState("Dashboard");

  const [tasks, setTasks] = useState([]);

  const [taskTitle, setTaskTitle] = useState("");
  const [subject, setSubject] = useState("Study");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [seconds, setSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusSessions, setFocusSessions] = useState(0);

  const [taskLoading, setTaskLoading] = useState(true);


  /* -----------------------------
     FIRESTORE TASKS
  ----------------------------- */

  useEffect(() => {
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const loadedTasks = snapshot.docs.map((task) => ({
          id: task.id,
          ...task.data()
        }));

        setTasks(loadedTasks);
        setTaskLoading(false);
      },
      (error) => {
        console.error(error);
        setTaskLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user.uid]);


  /* -----------------------------
     FOCUS TIMER
  ----------------------------- */

  useEffect(() => {
    let timer;

    if (timerRunning && seconds > 0) {
      timer = setInterval(() => {
        setSeconds((current) => current - 1);
      }, 1000);
    }

    if (seconds === 0 && timerRunning) {
      setTimerRunning(false);
      setFocusSessions((current) => current + 1);
    }

    return () => clearInterval(timer);
  }, [timerRunning, seconds]);


  /* -----------------------------
     TASK FUNCTIONS
  ----------------------------- */

  async function addTask() {
    if (taskTitle.trim() === "") {
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        userId: user.uid,
        title: taskTitle,
        subject: subject,
        priority: priority,
        dueDate: dueDate || "No date",
        completed: false,
        createdAt: new Date().toISOString()
      });

      setTaskTitle("");
      setSubject("Study");
      setPriority("Medium");
      setDueDate("");
    } catch (error) {
      console.error(error);
      alert("Could not add the task.");
    }
  }


  async function toggleTask(id, completed) {
    try {
      await updateDoc(doc(db, "tasks", id), {
        completed: !completed
      });
    } catch (error) {
      console.error(error);
    }
  }


  async function deleteTask(id) {
    try {
      await deleteDoc(doc(db, "tasks", id));
    } catch (error) {
      console.error(error);
    }
  }


  async function clearCompleted() {
    const completed = tasks.filter(
      (task) => task.completed
    );

    try {
      for (const task of completed) {
        await deleteDoc(
          doc(db, "tasks", task.id)
        );
      }
    } catch (error) {
      console.error(error);
    }
  }


  async function logout() {
    await signOut(auth);
  }


  /* -----------------------------
     FILTER TASKS
  ----------------------------- */

  function getFilteredTasks() {
    let result = [...tasks];

    if (filter === "Completed") {
      result = result.filter(
        (task) => task.completed
      );
    }

    if (filter === "Pending") {
      result = result.filter(
        (task) => !task.completed
      );
    }

    if (filter === "High") {
      result = result.filter(
        (task) =>
          task.priority === "High" &&
          !task.completed
      );
    }

    if (search.trim() !== "") {
      result = result.filter((task) => {
        const title = task.title || "";
        const taskSubject = task.subject || "";

        return (
          title
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          taskSubject
            .toLowerCase()
            .includes(search.toLowerCase())
        );
      });
    }

    return result;
  }


  /* -----------------------------
     STATISTICS
  ----------------------------- */

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks =
    tasks.length - completedTasks;

  const highPriority = tasks.filter(
    (task) =>
      task.priority === "High" &&
      !task.completed
  ).length;

  let progress = 0;

  if (tasks.length > 0) {
    progress = Math.round(
      (completedTasks / tasks.length) * 100
    );
  }


  /* -----------------------------
     TIMER DISPLAY
  ----------------------------- */

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedTime =
    String(minutes).padStart(2, "0") +
    ":" +
    String(remainingSeconds).padStart(2, "0");


  const todayTasks = tasks.filter(
    (task) =>
      task.dueDate === "Today" &&
      !task.completed
  );


  function showPage(page) {
    setActivePage(page);
  }


  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            ✦
          </div>

          <div>
            <strong>StudyFlow</strong>
            <span>Student productivity</span>
          </div>

        </div>


        <nav>

          <NavItem
            icon="⌂"
            label="Dashboard"
            activePage={activePage}
            showPage={showPage}
          />

          <NavItem
            icon="✓"
            label="My Tasks"
            activePage={activePage}
            showPage={showPage}
          />

          <NavItem
            icon="◷"
            label="Focus"
            activePage={activePage}
            showPage={showPage}
          />

          <NavItem
            icon="↗"
            label="Progress"
            activePage={activePage}
            showPage={showPage}
          />

          <NavItem
            icon="?"
            label="About"
            activePage={activePage}
            showPage={showPage}
          />

        </nav>


        <div className="sidebar-footer">

          <div className="sidebar-tip">

            <span>✦</span>

            <div>
              <strong>Study tip</strong>

              <p>
                Focus on progress,
                not perfection.
              </p>
            </div>

          </div>

        </div>

      </aside>


      {/* MAIN */}

      <main className="main">

        <header className="topbar">

          <div className="mobile-brand">
            <span>✦</span>
            StudyFlow
          </div>

          <div className="top-date">
            {new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric"
              }
            )}
          </div>


          <div className="profile">

            <div className="profile-avatar">
              {(
                user.displayName ||
                user.email ||
                "S"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.displayName || "Student"}
              </strong>

              <span>
                My workspace
              </span>
            </div>

            <button
              className="logout-button"
              onClick={logout}
            >
              Logout
            </button>

          </div>

        </header>


        {/* DASHBOARD */}

        {activePage === "Dashboard" && (
          <Dashboard
            user={user}
            tasks={tasks}
            completedTasks={completedTasks}
            pendingTasks={pendingTasks}
            highPriority={highPriority}
            progress={progress}
            todayTasks={todayTasks}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            showPage={showPage}
            taskLoading={taskLoading}
          />
        )}


        {/* TASKS */}

        {activePage === "My Tasks" && (
          <TasksPage
            taskTitle={taskTitle}
            setTaskTitle={setTaskTitle}
            subject={subject}
            setSubject={setSubject}
            priority={priority}
            setPriority={setPriority}
            dueDate={dueDate}
            setDueDate={setDueDate}
            addTask={addTask}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            getFilteredTasks={getFilteredTasks}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            clearCompleted={clearCompleted}
            taskLoading={taskLoading}
          />
        )}


        {/* FOCUS */}

        {activePage === "Focus" && (
          <FocusPage
            formattedTime={formattedTime}
            timerRunning={timerRunning}
            setTimerRunning={setTimerRunning}
            resetTimer={() => {
              setTimerRunning(false);
              setSeconds(25 * 60);
            }}
            focusSessions={focusSessions}
          />
        )}


        {/* PROGRESS */}

        {activePage === "Progress" && (
          <ProgressPage
            tasks={tasks}
            completedTasks={completedTasks}
            pendingTasks={pendingTasks}
            progress={progress}
          />
        )}


        {/* ABOUT */}

        {activePage === "About" && (
          <AboutPage />
        )}


        <footer>
          <strong>✦ StudyFlow</strong>
          <span>Plan smarter. Study better.</span>
        </footer>

      </main>

    </div>
  );
}


/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({
  user,
  tasks,
  completedTasks,
  pendingTasks,
  highPriority,
  progress,
  todayTasks,
  toggleTask,
  deleteTask,
  showPage,
  taskLoading
}) {
  return (
    <div className="page">

      <div className="welcome">

        <div>

          <p className="eyebrow">
            YOUR DASHBOARD
          </p>

          <h1>
            Good to see you,{" "}
            {user.displayName || "Student"}!
            <span> ✦</span>
          </h1>

          <p>
            Here's a quick look at
            your productivity today.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() => showPage("My Tasks")}
        >
          + New Task
        </button>

      </div>


      <div className="stats-grid">

        <StatCard
          icon="✓"
          title="Total Tasks"
          value={tasks.length}
          type="blue"
        />

        <StatCard
          icon="✓"
          title="Completed"
          value={completedTasks}
          type="green"
        />

        <StatCard
          icon="!"
          title="High Priority"
          value={highPriority}
          type="orange"
        />

        <StatCard
          icon="↗"
          title="Progress"
          value={progress + "%"}
          type="purple"
        />

      </div>


      <div className="dashboard-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <p className="eyebrow">
                TODAY
              </p>

              <h2>
                Today's Tasks
              </h2>
            </div>

            <button
              className="text-button"
              onClick={() => showPage("My Tasks")}
            >
              View all →
            </button>

          </div>


          {taskLoading ? (
            <div className="dashboard-empty">
              <p>Loading your tasks...</p>
            </div>
          ) : todayTasks.length === 0 ? (
            <div className="dashboard-empty">

              <div>✓</div>

              <h3>
                Your day is clear!
              </h3>

              <p>
                Add a task with
                "Today" as the date
                to see it here.
              </p>

            </div>
          ) : (
            <div className="task-list">

              {todayTasks
                .slice(0, 4)
                .map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    toggleTask={toggleTask}
                    deleteTask={deleteTask}
                  />
                ))}

            </div>
          )}

        </div>


        <div className="panel progress-panel">

          <div className="panel-header">

            <div>
              <p className="eyebrow">
                YOUR PROGRESS
              </p>

              <h2>
                Overall Progress
              </h2>
            </div>

          </div>


          <div
            className="progress-ring"
            style={{
              "--progress": progress + "%"
            }}
          >
            <div>

              <strong>
                {progress}%
              </strong>

              <span>
                completed
              </span>

            </div>
          </div>


          <div className="progress-line">

            <div
              style={{
                width: progress + "%"
              }}
            ></div>

          </div>


          <div className="progress-stats">

            <div>
              <strong>{completedTasks}</strong>
              <span>Completed</span>
            </div>

            <div>
              <strong>{pendingTasks}</strong>
              <span>Remaining</span>
            </div>

          </div>

        </div>

      </div>


      <div className="quick-actions">

        <div
          className="quick-card"
          onClick={() => showPage("My Tasks")}
        >
          <div>✓</div>

          <h3>
            Manage Tasks
          </h3>

          <p>
            Add and organize
            your work.
          </p>

        </div>


        <div
          className="quick-card"
          onClick={() => showPage("Focus")}
        >
          <div>◷</div>

          <h3>
            Start Focusing
          </h3>

          <p>
            Begin a focused
            study session.
          </p>

        </div>


        <div
          className="quick-card"
          onClick={() => showPage("Progress")}
        >
          <div>↗</div>

          <h3>
            View Progress
          </h3>

          <p>
            See your productivity
            statistics.
          </p>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   TASKS PAGE
===================================================== */

function TasksPage({
  taskTitle,
  setTaskTitle,
  subject,
  setSubject,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  addTask,
  filter,
  setFilter,
  search,
  setSearch,
  getFilteredTasks,
  toggleTask,
  deleteTask,
  clearCompleted,
  taskLoading
}) {
  const filters = [
    "All",
    "Pending",
    "Completed",
    "High"
  ];

  return (
    <div className="page">

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            PRODUCTIVITY
          </p>

          <h1>
            My Tasks
          </h1>

          <p>
            Keep track of everything
            you need to accomplish.
          </p>

        </div>

        <button
          className="secondary-button"
          onClick={clearCompleted}
        >
          Clear completed
        </button>

      </div>


      <div className="add-task-panel">

        <input
          value={taskTitle}
          onChange={(event) =>
            setTaskTitle(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addTask();
            }
          }}
          placeholder="What do you need to accomplish?"
        />


        <div className="task-form">

          <select
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
          >
            <option>Study</option>
            <option>Mathematics</option>
            <option>Science</option>
            <option>English</option>
            <option>Coding</option>
            <option>Personal</option>
          </select>


          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>


          <select
            value={dueDate}
            onChange={(event) =>
              setDueDate(event.target.value)
            }
          >
            <option value="">
              Due date
            </option>

            <option value="Today">
              Today
            </option>

            <option value="Tomorrow">
              Tomorrow
            </option>

            <option value="This week">
              This week
            </option>
          </select>


          <button
            className="primary-button"
            onClick={addTask}
          >
            + Add Task
          </button>

        </div>

      </div>


      <div className="task-controls">

        <div className="filters">

          {filters.map((option) => (
            <button
              key={option}
              className={
                filter === option
                  ? "filter-active"
                  : ""
              }
              onClick={() =>
                setFilter(option)
              }
            >
              {option}
            </button>
          ))}

        </div>


        <div className="search">

          <span>⌕</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search tasks..."
          />

        </div>

      </div>


      <div className="full-task-list">

        {taskLoading ? (
          <div className="large-empty">
            <h2>
              Loading your tasks...
            </h2>
          </div>
        ) : getFilteredTasks().length === 0 ? (
          <div className="large-empty">

            <div>✓</div>

            <h2>
              No tasks found
            </h2>

            <p>
              Add a task to get started.
            </p>

          </div>
        ) : (
          getFilteredTasks().map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
            />
          ))
        )}

      </div>

    </div>
  );
}


/* =====================================================
   FOCUS PAGE
===================================================== */

function FocusPage({
  formattedTime,
  timerRunning,
  setTimerRunning,
  resetTimer,
  focusSessions
}) {
  return (
    <div className="page">

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            DEEP WORK
          </p>

          <h1>
            Focus Timer
          </h1>

          <p>
            Give one task your
            full attention.
          </p>

        </div>

      </div>


      <div className="focus-layout">

        <div className="focus-main">

          <div className="focus-label">
            {timerRunning
              ? "FOCUS SESSION IN PROGRESS"
              : "READY TO FOCUS"}
          </div>


          <div className="big-timer">
            {formattedTime}
          </div>


          <p className="focus-message">
            {timerRunning
              ? "Stay focused. You've got this!"
              : "Take 25 minutes to work without distractions."}
          </p>


          <div className="timer-actions">

            <button
              className="primary-button large-button"
              onClick={() =>
                setTimerRunning(!timerRunning)
              }
            >
              {timerRunning
                ? "Pause Session"
                : "Start Focus"}
            </button>


            <button
              className="secondary-button large-button"
              onClick={resetTimer}
            >
              Reset
            </button>

          </div>


          <div className="session-count">

            <span>
              Focus sessions completed
            </span>

            <strong>
              {focusSessions}
            </strong>

          </div>

        </div>


        <div className="focus-tips">

          <p className="eyebrow">
            FOCUS TIPS
          </p>

          <h2>
            Make your session count.
          </h2>


          <div className="tip">
            <span>01</span>

            <p>
              Choose one task
              before starting.
            </p>
          </div>


          <div className="tip">
            <span>02</span>

            <p>
              Put distractions
              away.
            </p>
          </div>


          <div className="tip">
            <span>03</span>

            <p>
              Take a short break
              when you're done.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   PROGRESS PAGE
===================================================== */

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

          <p className="eyebrow">
            ANALYTICS
          </p>

          <h1>
            Your Progress
          </h1>

          <p>
            See how you're doing
            and keep improving.
          </p>

        </div>

      </div>


      <div className="progress-overview">

        <div className="progress-big-card">

          <p className="eyebrow">
            OVERALL COMPLETION
          </p>

          <strong>
            {progress}%
          </strong>

          <p>
            You've completed{" "}
            {completedTasks} out of{" "}
            {tasks.length} tasks.
          </p>


          <div className="large-progress">

            <div
              style={{
                width: progress + "%"
              }}
            ></div>

          </div>

        </div>


        <div className="mini-stat">

          <span>
            Completed
          </span>

          <strong>
            {completedTasks}
          </strong>

          <small>
            tasks finished
          </small>

        </div>


        <div className="mini-stat">

          <span>
            Remaining
          </span>

          <strong>
            {pendingTasks}
          </strong>

          <small>
            tasks to go
          </small>

        </div>

      </div>


      <div className="subject-section">

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              BY SUBJECT
            </p>

            <h2>
              Task Breakdown
            </h2>

          </div>

        </div>


        <div className="subject-list">

          {subjects.map((name) => {

            const subjectTasks = tasks.filter(
              (task) => task.subject === name
            );

            const completed = subjectTasks.filter(
              (task) => task.completed
            ).length;

            let percentage = 0;

            if (subjectTasks.length > 0) {
              percentage = Math.round(
                (completed / subjectTasks.length) * 100
              );
            }

            return (
              <div
                className="subject-row"
                key={name}
              >

                <div className="subject-name">

                  <strong>
                    {name}
                  </strong>

                  <span>
                    {completed}/
                    {subjectTasks.length}
                    {" "}completed
                  </span>

                </div>


                <div className="subject-progress">

                  <div>
                    <div
                      style={{
                        width: percentage + "%"
                      }}
                    ></div>
                  </div>

                  <strong>
                    {percentage}%
                  </strong>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   ABOUT PAGE
===================================================== */

function AboutPage() {
  return (
    <div className="page">

      <div className="about-hero">

        <div>

          <p className="eyebrow">
            ABOUT STUDYFLOW
          </p>

          <h1>
            A simpler way to
            organize student life.
          </h1>

          <p>
            StudyFlow is a student-focused
            productivity platform designed
            to bring tasks, priorities,
            progress tracking and focused
            study sessions into one simple
            workspace.
          </p>

        </div>


        <div className="about-symbol">
          ✦
        </div>

      </div>


      <div className="feature-grid">

        <Feature
          icon="✓"
          title="Task Management"
          text="Create, organize, prioritize and complete your daily tasks."
        />

        <Feature
          icon="↗"
          title="Progress Tracking"
          text="Understand your productivity with live completion statistics."
        />

        <Feature
          icon="◷"
          title="Focused Study"
          text="Use focused sessions to give important work your full attention."
        />

        <Feature
          icon="◆"
          title="Personal Workspace"
          text="Your tasks belong to your account and are stored securely in the database."
        />

      </div>


      <div className="how-section">

        <p className="eyebrow">
          HOW IT WORKS
        </p>

        <h2>
          Three simple steps.
        </h2>


        <div className="steps">

          <div>
            <span>01</span>

            <h3>
              Add
            </h3>

            <p>
              Create tasks for school,
              coding, study or personal
              goals.
            </p>
          </div>


          <div>
            <span>02</span>

            <h3>
              Focus
            </h3>

            <p>
              Choose what matters and
              work through your priorities.
            </p>
          </div>


          <div>
            <span>03</span>

            <h3>
              Improve
            </h3>

            <p>
              Track your progress and
              build better study habits.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   SMALL COMPONENTS
===================================================== */

function NavItem({
  icon,
  label,
  activePage,
  showPage
}) {
  return (
    <button
      className={
        activePage === label
          ? "nav-item active"
          : "nav-item"
      }
      onClick={() => showPage(label)}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}


function StatCard({
  icon,
  title,
  value,
  type
}) {
  return (
    <div className="stat-card">

      <div className={"stat-icon " + type}>
        {icon}
      </div>

      <div>

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}


function TaskRow({
  task,
  toggleTask,
  deleteTask
}) {
  return (
    <div
      className={
        task.completed
          ? "task-row completed"
          : "task-row"
      }
    >

      <button
        className="task-check"
        onClick={() =>
          toggleTask(
            task.id,
            task.completed
          )
        }
      >
        {task.completed ? "✓" : ""}
      </button>


      <div className="task-details">

        <h3>
          {task.title}
        </h3>


        <div className="task-meta">

          <span className="subject-tag">
            {task.subject || "Study"}
          </span>


          <span
            className={
              "priority " +
              (
                task.priority || "Medium"
              ).toLowerCase()
            }
          >
            {task.priority || "Medium"}
          </span>


          <span className="due-date">
            📅 {task.dueDate || "No date"}
          </span>

        </div>

      </div>


      <button
        className="delete-button"
        onClick={() =>
          deleteTask(task.id)
        }
      >
        ×
      </button>

    </div>
  );
}


function Feature({
  icon,
  title,
  text
}) {
  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  );
}


export default App;