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
      <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center max-w-xl mx-auto">
        <p className="text-sm font-medium mb-2">Select or upload a document first</p>
        <Link
          to="/upload"
          className="inline-flex px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
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

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{activeDoc.title}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Action Plan Generator</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {completedCount} of {tasks.length} steps completed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
          <button
            type="button"
            disabled={generating}
            onClick={() => void handleGenerate()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {generating ? 'Generating Plan...' : tasks.length > 0 ? 'Regenerate Plan' : 'Generate Action Plan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={(e) => void handleAddTask(e)}
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <h2 className="font-display text-sm font-semibold">Add Custom Task</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Task Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Obtain notarized copy of transcript"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Additional details or notes"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Optional Deadline</label>
              <input
                type="text"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                placeholder="e.g., March 18, 2027"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center">
          <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No action plan tasks yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Click Generate Action Plan to turn this document into ordered, checkable steps with source citations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <div
              key={task.id}
              className={`rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 transition-opacity ${
                task.completed ? 'opacity-70' : ''
              }`}
            >
              {editingId === task.id ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="sm:col-span-2 px-3 py-1.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
                    />
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
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
                      className="sm:col-span-2 px-3 py-1.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
                    />
                    <input
                      type="text"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      placeholder="Deadline"
                      className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
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
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => void toggleTaskCompletion(activeDoc.id, task.id, !task.completed)}
                    aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                    className="mt-0.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        Step {idx + 1}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-medium capitalize ${
                          task.priority === 'high'
                            ? 'text-rose-600 dark:text-rose-400'
                            : task.priority === 'medium'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {task.priority} priority
                      </span>
                      {task.deadline && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">Due: {task.deadline}</span>
                        </>
                      )}
                    </div>

                    <h2
                      className={`text-sm font-semibold ${
                        task.completed ? 'line-through text-slate-400' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {task.title}
                    </h2>
                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                    {task.sourceReference && (
                      <p className="text-[11px] text-slate-400 mt-2">
                        Source: {task.sourceReference}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(task)}
                      aria-label="Edit task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[var(--text-primary)]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeTask(activeDoc.id, task.id)}
                      aria-label="Delete task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
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
