"use client";

import { FormEvent, useMemo, useState } from "react";

type Level = "low" | "medium" | "high";

type Priority =
  | "今すぐやる"
  | "今日中にやる"
  | "今週やる"
  | "後回し";

type Task = {
  id: number;
  title: string;
  deadline: string;
  importance: Level;
  urgency: Level;
  duration: number;
  score: number;
  priority: Priority;
  reasons: string[];
  completed: boolean;
};

type PriorityResult = {
  score: number;
  priority: Priority;
  reasons: string[];
};

const levelLabel: Record<Level, string> = {
  low: "低い",
  medium: "普通",
  high: "高い",
};

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateDateDifference(deadline: string) {
  if (!deadline) {
    return null;
  }

  const today = new Date(getTodayString());
  const deadlineDate = new Date(deadline);

  const difference =
    deadlineDate.getTime() - today.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );
}

function calculatePriority(
  deadline: string,
  importance: Level,
  urgency: Level,
  duration: number
): PriorityResult {
  let score = 0;
  const reasons: string[] = [];

  const remainingDays =
    calculateDateDifference(deadline);

  if (remainingDays !== null) {
    if (remainingDays < 0) {
      score += 7;
      reasons.push("締切を過ぎています");
    } else if (remainingDays === 0) {
      score += 6;
      reasons.push("締切が今日です");
    } else if (remainingDays === 1) {
      score += 4;
      reasons.push("締切が明日です");
    } else if (remainingDays <= 3) {
      score += 3;
      reasons.push("締切まで3日以内です");
    } else if (remainingDays <= 7) {
      score += 2;
      reasons.push("締切まで1週間以内です");
    } else {
      reasons.push("締切まで余裕があります");
    }
  } else {
    score -= 1;
    reasons.push("締切が設定されていません");
  }

  if (importance === "high") {
    score += 4;
    reasons.push("重要度が高いです");
  } else if (importance === "medium") {
    score += 2;
    reasons.push("重要度は普通です");
  } else {
    reasons.push("重要度は低めです");
  }

  if (urgency === "high") {
    score += 4;
    reasons.push("緊急度が高いです");
  } else if (urgency === "medium") {
    score += 2;
    reasons.push("緊急度は普通です");
  } else {
    reasons.push("緊急度は低めです");
  }

  if (duration <= 15) {
    score += 2;
    reasons.push("短時間で完了できます");
  } else if (duration <= 30) {
    score += 1;
    reasons.push("30分以内で完了できます");
  } else if (duration >= 180) {
    score -= 1;
    reasons.push(
      "まとまった作業時間が必要です"
    );
  }

  let priority: Priority;

  if (score >= 11) {
    priority = "今すぐやる";
  } else if (score >= 8) {
    priority = "今日中にやる";
  } else if (score >= 4) {
    priority = "今週やる";
  } else {
    priority = "後回し";
  }

  return {
    score,
    priority,
    reasons,
  };
}

function getPriorityClass(priority: Priority) {
  switch (priority) {
    case "今すぐやる":
      return "priority-now";

    case "今日中にやる":
      return "priority-today";

    case "今週やる":
      return "priority-week";

    case "後回し":
      return "priority-later";

    default:
      return "";
  }
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [importance, setImportance] =
    useState<Level>("medium");
  const [urgency, setUrgency] =
    useState<Level>("medium");
  const [duration, setDuration] = useState(30);

  const [tasks, setTasks] = useState<Task[]>([]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((taskA, taskB) => {
      if (taskA.completed !== taskB.completed) {
        return (
          Number(taskA.completed) -
          Number(taskB.completed)
        );
      }

      return taskB.score - taskA.score;
    });
  }, [tasks]);

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedCount / tasks.length) * 100
        );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      alert("タスク名を入力してください。");
      return;
    }

    if (duration <= 0) {
      alert(
        "所要時間は1分以上にしてください。"
      );
      return;
    }

    const result = calculatePriority(
      deadline,
      importance,
      urgency,
      duration
    );

    const newTask: Task = {
      id: Date.now(),
      title: trimmedTitle,
      deadline,
      importance,
      urgency,
      duration,
      score: result.score,
      priority: result.priority,
      reasons: result.reasons,
      completed: false,
    };

    setTasks((currentTasks) => [
      ...currentTasks,
      newTask,
    ]);

    setTitle("");
    setDeadline("");
    setImportance("medium");
    setUrgency("medium");
    setDuration(30);
  }

  function toggleTask(taskId: number) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      )
    );
  }

  function deleteTask(taskId: number) {
    const shouldDelete = window.confirm(
      "このタスクを削除しますか？"
    );

    if (!shouldDelete) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter(
        (task) => task.id !== taskId
      )
    );
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">
            業務効率化ツール
          </p>

          <h1>Task Priority AI</h1>

          <p className="hero-description">
            締切・重要度・緊急度・所要時間から、
            タスクの優先順位を自動判定します。
          </p>
        </div>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <span>登録タスク</span>
          <strong>{tasks.length}</strong>
          <small>件</small>
        </article>

        <article className="summary-card">
          <span>完了タスク</span>
          <strong>{completedCount}</strong>
          <small>件</small>
        </article>

        <article className="summary-card">
          <span>達成率</span>
          <strong>{progress}</strong>
          <small>%</small>
        </article>

        <article className="summary-card">
          <span>最優先</span>
          <strong>
            {
              tasks.filter(
                (task) =>
                  task.priority ===
                    "今すぐやる" &&
                  !task.completed
              ).length
            }
          </strong>
          <small>件</small>
        </article>
      </section>

      <section className="panel">
        <h2>新しいタスクを登録</h2>

        <form
          className="task-form"
          onSubmit={handleSubmit}
        >
          <label>
            タスク名
            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="例：見積書を作成する"
            />
          </label>

          <label>
            締切
            <input
              type="date"
              value={deadline}
              onChange={(event) =>
                setDeadline(event.target.value)
              }
            />
          </label>

          <label>
            重要度
            <select
              value={importance}
              onChange={(event) =>
                setImportance(
                  event.target.value as Level
                )
              }
            >
              <option value="low">低い</option>
              <option value="medium">
                普通
              </option>
              <option value="high">高い</option>
            </select>
          </label>

          <label>
            緊急度
            <select
              value={urgency}
              onChange={(event) =>
                setUrgency(
                  event.target.value as Level
                )
              }
            >
              <option value="low">低い</option>
              <option value="medium">
                普通
              </option>
              <option value="high">高い</option>
            </select>
          </label>

          <label>
            所要時間
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(event) =>
                setDuration(
                  Number(event.target.value)
                )
              }
            />
          </label>

          <button type="submit">
            優先順位を判定する
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>タスク一覧</h2>

        {sortedTasks.length === 0 ? (
          <p>タスクはまだありません。</p>
        ) : (
          <div className="task-list">
            {sortedTasks.map((task) => (
              <article
                key={task.id}
                className={`task-card ${
                  task.completed
                    ? "task-completed"
                    : ""
                }`}
              >
                <div>
                  <h3>{task.title}</h3>

                  <span
                    className={getPriorityClass(
                      task.priority
                    )}
                  >
                    {task.priority}
                  </span>

                  <p>
                    スコア：{task.score}点
                  </p>

                  <p>
                    締切：
                    {task.deadline || "設定なし"}
                  </p>

                  <p>
                    重要度：
                    {levelLabel[task.importance]}
                  </p>

                  <p>
                    緊急度：
                    {levelLabel[task.urgency]}
                  </p>

                  <p>
                    所要時間：
                    {task.duration}分
                  </p>

                  <details>
                    <summary>
                      判定理由を見る
                    </summary>

                    <ul>
                      {task.reasons.map(
                        (reason, index) => (
                          <li
                            key={`${task.id}-${index}`}
                          >
                            {reason}
                          </li>
                        )
                      )}
                    </ul>
                  </details>
                </div>

                <div className="task-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      toggleTask(task.id)
                    }
                  >
                    {task.completed
                      ? "未完了に戻す"
                      : "完了"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteTask(task.id)
                    }
                  >
                    削除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}