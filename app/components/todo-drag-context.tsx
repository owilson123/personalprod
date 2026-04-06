'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';

export interface DragTodo { id: string; text: string; }

interface TodoDragCtxValue {
  dragTodo: DragTodo | null;
  setDragTodo: (t: DragTodo | null) => void;
}

const TodoDragCtx = createContext<TodoDragCtxValue>({ dragTodo: null, setDragTodo: () => {} });

export function TodoDragProvider({ children }: { children: ReactNode }) {
  const [dragTodo, setDragTodo] = useState<DragTodo | null>(null);
  return <TodoDragCtx.Provider value={{ dragTodo, setDragTodo }}>{children}</TodoDragCtx.Provider>;
}

export const useTodoDrag = () => useContext(TodoDragCtx);
