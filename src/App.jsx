import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("studyflow-tasks");

    if (savedTasks) {
      return JSON.parse(savedTasks);
    }

    return [
      {
        id: 1,
        title: "Complete mathematics homework",
        category: "School",
        completed: true
      },
      {
        id: 2,
        title: "Read science chapter 4",
        category: "Study",
        completed: false
      },
      {
        id: 3,
        title: "Practice JavaScript",
        category: "Coding",
        completed: false
      }
    ];
  });

  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("Study");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    localStorage.setItem("studyflow-tasks", JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (newTask.trim() === "") {
      return;
    }

    const task = {
      id: Date.now(),
      title: newTask,
      category: category,
      completed: false
    };

    setTasks([task, ...tasks]);
    setNewTask("");
  }

  function toggleTask(id) {
    const updatedTasks = tasks.map(function (task) {
      if (task.id === id) {
        return {
          ...task,
          completed: !task.completed
        };
      }

      return task;
    });

    setTasks(updatedTasks);
  }

  function deleteTask(id) {
    const updatedTasks = tasks.filter(function (task) {
      return task.id !== id;
    });

    setTasks(updatedTasks);
  }

  function getFilteredTasks() {
    if (filter === "Completed") {
      return tasks.filter(function (task) {
        return task.completed;
      });
    }

    if (filter === "Pending") {
      return tasks.filter(function (task) {
        return !task.completed;
      });
    }

    return tasks;
  }

  const completedTasks = tasks.filter(function (task) {
    return task.completed;
  }).length;

  const totalTasks = tasks.length;

  let progress = 0;

  if (totalTasks > 0) {
    progress = Math.round((completedTasks / totalTasks) * 100);
  }

  return (
    <div className="app">

      <nav className="navbar">
        <div className="logo">
          <span>✦</span> StudyFlow
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#about">About</a>
        </div>

        <button className="nav-button">Get Started</button>
      </nav>

      <main>

        <section className="hero" id="home">
          <div className="hero-text">
            <p className="small-heading">YOUR PERSONAL STUDY SPACE</p>

            <h1>
              Plan smarter.
              <br />
              <span>Study better.</span>
            </h1>

            <p className="hero-description">
              StudyFlow helps students organize their tasks, track their
              progress and stay focused on what matters.
            </p>

            <a href="#dashboard" className="hero-button">
              Open Dashboard →
            </a>
          </div>

          <div className="hero-card">
            <div className="floating-icon">✓</div>

            <p>Today's Progress</p>

            <h2>{progress}%</h2>

            <div className="progress-background">
              <div
                className="progress-bar"
                style={{ width: progress + "%" }}
              ></div>
            </div>

            <small>
              {completedTasks} of {totalTasks} tasks completed
            </small>
          </div>
        </section>

        <section className="stats">
          <div>
            <strong>{totalTasks}</strong>
            <span>Total Tasks</span>
          </div>

          <div>
            <strong>{completedTasks}</strong>
            <span>Completed</span>
          </div>

          <div>
            <strong>{totalTasks - completedTasks}</strong>
            <span>Remaining</span>
          </div>

          <div>
            <strong>{progress}%</strong>
            <span>Progress</span>
          </div>
        </section>

        <section className="dashboard" id="dashboard">

          <div className="section-heading">
            <div>
              <p className="small-heading">PRODUCTIVITY DASHBOARD</p>
              <h2>Today's Tasks</h2>
            </div>

            <div className="date">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric"
              })}
            </div>
          </div>

          <div className="task-input">

            <input
              type="text"
              placeholder="What do you need to do?"
              value={newTask}
              onChange={function (event) {
                setNewTask(event.target.value);
              }}
              onKeyDown={function (event) {
                if (event.key === "Enter") {
                  addTask();
                }
              }}
            />

            <select
              value={category}
              onChange={function (event) {
                setCategory(event.target.value);
              }}
            >
              <option>Study</option>
              <option>School</option>
              <option>Coding</option>
              <option>Personal</option>
            </select>

            <button onClick={addTask}>+ Add Task</button>

          </div>

          <div className="filters">
            <button
              className={filter === "All" ? "active" : ""}
              onClick={function () {
                setFilter("All");
              }}
            >
              All
            </button>

            <button
              className={filter === "Pending" ? "active" : ""}
              onClick={function () {
                setFilter("Pending");
              }}
            >
              Pending
            </button>

            <button
              className={filter === "Completed" ? "active" : ""}
              onClick={function () {
                setFilter("Completed");
              }}
            >
              Completed
            </button>
          </div>

          <div className="task-list">

            {getFilteredTasks().length === 0 ? (
              <div className="empty">
                <div>✓</div>
                <h3>No tasks here</h3>
                <p>Add a new task to get started.</p>
              </div>
            ) : (
              getFilteredTasks().map(function (task) {
                return (
                  <div
                    className={
                      task.completed
                        ? "task-card completed"
                        : "task-card"
                    }
                    key={task.id}
                  >

                    <button
                      className="check"
                      onClick={function () {
                        toggleTask(task.id);
                      }}
                    >
                      {task.completed ? "✓" : ""}
                    </button>

                    <div className="task-content">
                      <h3>{task.title}</h3>
                      <span>{task.category}</span>
                    </div>

                    <button
                      className="delete"
                      onClick={function () {
                        deleteTask(task.id);
                      }}
                    >
                      Delete
                    </button>

                  </div>
                );
              })
            )}

          </div>

        </section>

        <section className="features" id="about">

          <div className="feature-heading">
            <p className="small-heading">WHY STUDYFLOW?</p>
            <h2>Everything you need to stay organized.</h2>
          </div>

          <div className="feature-grid">

            <div className="feature-card">
              <div className="feature-icon">✓</div>
              <h3>Simple Task Management</h3>
              <p>
                Add, complete and organize your daily tasks in one place.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">↗</div>
              <h3>Track Your Progress</h3>
              <p>
                See how much of your work is completed with live progress
                statistics.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⌁</div>
              <h3>Always Saved</h3>
              <p>
                Your tasks stay saved in your browser even when you refresh
                the page.
              </p>
            </div>

          </div>

        </section>

      </main>

      <footer>
        <div className="logo">
          <span>✦</span> StudyFlow
        </div>

        <p>Built to make studying a little easier.</p>
      </footer>

    </div>
  );
}

export default App;