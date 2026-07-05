import { useState, useEffect, useCallback } from 'react'
import './App.css'

interface Todo {
  id: number
  text: string
  completed: boolean
  createdAt: number
}

type FilterType = 'all' | 'active' | 'completed'

function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('todos')
    return saved ? JSON.parse(saved) : []
  })
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  // 持久化
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  // 添加
  const addTodo = useCallback(() => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    const newTodo: Todo = {
      id: Date.now(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    }
    setTodos(prev => [...prev, newTodo])
    setInputValue('')
  }, [inputValue])

  // 删除
  const deleteTodo = useCallback((id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  // 切换完成
  const toggleTodo = useCallback((id: number) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  // 开始编辑
  const startEdit = useCallback((todo: Todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }, [])

  // 保存编辑
  const saveEdit = useCallback((id: number) => {
    const trimmed = editText.trim()
    if (!trimmed) {
      deleteTodo(id)
      return
    }
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, text: trimmed } : t))
    )
    setEditingId(null)
    setEditText('')
  }, [editText, deleteTodo])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  // 键盘事件
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter') action()
      if (e.key === 'Escape') cancelEdit()
    },
    [cancelEdit]
  )

  // 过滤
  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  // 统计
  const totalCount = todos.length
  const activeCount = todos.filter(t => !t.completed).length
  const completedCount = todos.filter(t => t.completed).length

  // 清空已完成
  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">📋 Todo List</h1>

        {/* 输入区域 */}
        <div className="input-area">
          <input
            className="todo-input"
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => handleKeyDown(e, addTodo)}
            placeholder="添加新的待办事项..."
            maxLength={100}
          />
          <button className="add-btn" onClick={addTodo} disabled={!inputValue.trim()}>
            ✚ 添加
          </button>
        </div>

        {/* 筛选和统计 */}
        <div className="toolbar">
          <div className="filter-group">
            {(['all', 'active', 'completed'] as FilterType[]).map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '全部' : f === 'active' ? '进行中' : '已完成'}
              </button>
            ))}
          </div>
          <div className="stats">
            <span className="stat-item">总计 {totalCount}</span>
            <span className="stat-item active">待办 {activeCount}</span>
            <span className="stat-item completed">完成 {completedCount}</span>
          </div>
        </div>

        {/* 列表 */}
        <div className="todo-list">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              {filter === 'all'
                ? '🎉 暂无待办事项'
                : filter === 'active'
                ? '✅ 所有事项都已完成！'
                : '📝 还没有完成的事项'}
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo.id}
                className={`todo-item ${todo.completed ? 'completed' : ''} ${
                  editingId === todo.id ? 'editing' : ''
                }`}
              >
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                {editingId === todo.id ? (
                  <input
                    className="edit-input"
                    type="text"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, () => saveEdit(todo.id))}
                    onBlur={() => saveEdit(todo.id)}
                    autoFocus
                    maxLength={100}
                  />
                ) : (
                  <span
                    className="todo-text"
                    onDoubleClick={() => startEdit(todo)}
                  >
                    {todo.text}
                  </span>
                )}
                <div className="todo-actions">
                  {editingId === todo.id ? (
                    <>
                      <button
                        className="action-btn save"
                        onClick={() => saveEdit(todo.id)}
                        title="保存"
                      >
                        💾
                      </button>
                      <button
                        className="action-btn cancel"
                        onClick={cancelEdit}
                        title="取消"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="action-btn edit"
                        onClick={() => startEdit(todo)}
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => deleteTodo(todo.id)}
                        title="删除"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部操作 */}
        {completedCount > 0 && (
          <div className="footer-actions">
            <button className="clear-btn" onClick={clearCompleted}>
              🧹 清空已完成 ({completedCount})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
