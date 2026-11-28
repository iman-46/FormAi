import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useHybridRunner } from '../hooks/useHybridRunner';
import { generateActionPlanItems } from '../services/hybridAIService';
import type { ActionTask, TaskPriority } from '../types';

export default function ActionPlanPage() {
  const {
    user,
    activeDoc,
    tasks,
    preferences,
    remoteConfig,
    replaceActionPlan,
    addTask,
    updateTask,
    toggleTaskCompletion,
    removeTask,
  } = useApp();
  const { executeTrackedTask } = useHybridRunner();

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newDeadline, setNewDeadline] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDeadline, setEditDeadline] = useState('');

  if (!activeDoc) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center max-w-xl mx-auto">
        <p className="text-sm font-semibold mb-2">Select or upload a document first</p>
        <Link
          to="/upload"
          className="inline-flex px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold"
        >
          Upload Document
        </Link>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!activeDoc.extractedText) {
      setError('No extracted text is available for this document.');
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await executeTrackedTask({
        operation: 'action_plan',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: preferences.defaultInferenceMode,
        consentReason: `Generate an ordered step-by-step action plan from "${activeDoc.title}".`,
        run: async (effectiveMode) => {
          const out = await generateActionPlanItems({
            userId: user?.uid || 'guest',
            docId: activeDoc.id,
            documentText: activeDoc.extractedText || '',
            mode: effectiveMode,
            remoteConfig,
          });
          return { data: out.tasks, meta: out.meta };
        },
      });
      if (res) {
        await replaceActionPlan(activeDoc.id, res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate action plan.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item: ActionTask = {
      id: `task_${Date.now()}`,
      userId: user?.uid || 'guest',
      docId: activeDoc.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      completed: false,
      deadline: newDeadline.trim() || undefined,
      sourceReference: 'Added manually by user',
      order: tasks.length + 1,
    };
    await addTask(item);
    setNewTitle('');
    setNewDesc('');
    setNewDeadline('');
    setShowAddForm(false);
  };

  const startEdit = (task: ActionTask) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditDeadline(task.deadline || '');
  };

  const saveEdit = async (task: ActionTask) => {
    await updateTask({
      ...task,
      title: editTitle.trim() || task.title,
      description: editDesc.trim(),
      priority: editPriority,
      deadline: editDeadline.trim() || undefined,
    });
    setEditingId(null);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const pct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const visibleTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{activeDoc.title}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
            Action Plan Generator
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => void handleGenerate()}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-settle whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            {generating ? 'Generating...' : tasks.length > 0 ? 'Regenerate' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {/* Progress & Filter Header */}
      {tasks.length > 0 && (
        <div className="rounded-xl surface-sheet p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="flex items-center justify-between text-xs tabular-nums">
              <span className="font-medium text-[var(--text-secondary)]">
                {completedCount} of {tasks.length} steps completed
              </span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {pct}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] w-full sm:w-auto">
            {(
              [
                ['all', `All (${tasks.length})`],
                ['pending', `Pending (${tasks.length - completedCount})`],
                ['completed', `Done (${completedCount})`],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilter(val)}
                className={`px-2 sm:px-3 min-h-[36px] py-1.5 text-xs font-medium rounded-md transition-settle whitespace-nowrap text-center ${
                  filter === val
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={(e) => void handleAddTask(e)}
          className="rounded-2xl surface-sheet p-6 space-y-4"
        >
          <h2 className="font-display text-sm font-bold">Add Custom Task</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Task Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Obtain notarized copy of transcript"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Additional details or notes"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Optional Deadline</label>
              <input
                type="text"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                placeholder="e.g., March 18, 2027"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-subtle)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center">
          <CheckSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">No action plan tasks yet</p>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Click Generate Action Plan to turn this document into ordered, checkable steps with source citations.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl surface-sheet divide-y divide-[var(--border-hairline)] overflow-hidden">
          {visibleTasks.map((task, idx) => (
            <div
              key={task.id}
              className={`p-5 transition-settle ${
                task.completed ? 'bg-[var(--bg-canvas)]/60 opacity-75' : 'hover:bg-[var(--bg-canvas)]/40'
              }`}
            >
              {editingId === task.id ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
                    />
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                      className="px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description"
                      className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
                    />
                    <input
                      type="text"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      placeholder="Deadline"
                      className="px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveEdit(task)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => void toggleTaskCompletion(activeDoc.id, task.id, !task.completed)}
                    aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                    className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] shrink-0 transition-settle"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                      <span className="font-mono font-semibold text-[var(--text-primary)] tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-medium capitalize ${
                          task.priority === 'high'
                            ? 'text-rose-600 dark:text-rose-400'
                            : task.priority === 'medium'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {task.priority} priority
                      </span>
                      {task.deadline && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Due {task.deadline}</span>
                        </>
                      )}
                    </div>

                    <h2
                      className={`text-sm font-semibold ${
                        task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {task.title}
                    </h2>
                    {task.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    {task.sourceReference && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-2">
                        Source: {task.sourceReference}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      aria-label="Edit task"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-settle"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeTask(activeDoc.id, task.id)}
                      aria-label="Delete task"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-settle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
