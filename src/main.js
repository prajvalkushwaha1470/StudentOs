import './style.css'

const storageKey = 'studentos-state'
const sessionKey = 'studentos-session'
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const schedule = {
  Monday: [{ subject: 'Database Systems', time: '09:00 - 10:00', room: 'B-204' }, { subject: 'Operating Systems', time: '11:15 - 12:15', room: 'Lab 2' }],
  Tuesday: [{ subject: 'Computer Networks', time: '10:00 - 11:00', room: 'A-108' }, { subject: 'Software Engineering', time: '13:00 - 14:00', room: 'B-204' }],
  Wednesday: [{ subject: 'Web Technologies', time: '09:00 - 10:00', room: 'Lab 1' }, { subject: 'Database Systems', time: '12:00 - 13:00', room: 'B-204' }],
  Thursday: [{ subject: 'Operating Systems', time: '10:00 - 11:00', room: 'A-108' }, { subject: 'Computer Networks', time: '14:00 - 15:00', room: 'A-108' }],
  Friday: [{ subject: 'Software Engineering', time: '09:00 - 10:00', room: 'B-204' }],
  Saturday: [],
  Sunday: [],
}

const initialState = { attendance: { conducted: 0, attended: 0, target: 75, dailyEntry: null }, collegeDay: { startDate: '', endDate: '', status: 'college', conducted: 0, attended: 0, recordedDate: '' }, tasks: [], notices: [] }
let state = JSON.parse(localStorage.getItem(storageKey) || 'null') || initialState
state.attendance = { ...initialState.attendance, ...state.attendance }
state.collegeDay = { ...initialState.collegeDay, ...state.collegeDay }
const today = new Date()
const todayName = weekdays[today.getDay()]
const todayLectures = schedule[todayName]
const isTodayHoliday = () => state.collegeDay.status === 'holiday' && state.collegeDay.recordedDate === todayISO()

const formatDate = date => date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const dateLabel = date => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const todayISO = () => today.toISOString().slice(0, 10)
const save = () => localStorage.setItem(storageKey, JSON.stringify(state))
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]))
const percentage = () => state.attendance.conducted ? (state.attendance.attended / state.attendance.conducted) * 100 : 0
const pendingTasks = () => state.tasks.filter(task => !task.completed)
const dueState = task => task.completed ? 'complete' : task.dueDate < today.toISOString().slice(0, 10) ? 'overdue' : 'upcoming'
const dueText = task => task.completed ? 'Completed' : task.dueDate ? `${dueState(task) === 'overdue' ? 'Overdue' : 'Due'} ${dateLabel(task.dueDate)}` : 'No due date'

function applyTodayAttendance(status, conducted, attended) {
  const previous = state.attendance.dailyEntry
  if (previous?.date === todayISO()) {
    state.attendance.conducted -= previous.conducted
    state.attendance.attended -= previous.attended
  }
  const entry = status === 'college' ? { date: todayISO(), conducted, attended } : { date: todayISO(), conducted: 0, attended: 0 }
  state.attendance.conducted += entry.conducted
  state.attendance.attended += entry.attended
  state.attendance.dailyEntry = entry
  state.collegeDay.status = status
  state.collegeDay.conducted = entry.conducted
  state.collegeDay.attended = entry.attended
  state.collegeDay.recordedDate = todayISO()
}

function attendanceMessage() {
  const { conducted, attended, target } = state.attendance
  if (!conducted) return 'Add your lecture counts to see your attendance plan.'
  if (percentage() >= target) {
    const canMiss = Math.floor((attended * 100 - target * conducted) / target)
    return canMiss > 0 ? `You can miss ${canMiss} upcoming lecture${canMiss === 1 ? '' : 's'} and stay at ${target}% or above.` : 'You are at target. Keep attending to build a buffer.'
  }
  const needed = Math.ceil((target * conducted - 100 * attended) / (100 - target))
  return `Attend the next ${needed} lecture${needed === 1 ? '' : 's'} to reach ${target}%.`
}

function renderLogin(error = '', invalidField = '') {
  document.querySelector('#app').innerHTML = `
    <div class="login-shell" style="--pointer-x: 50%; --pointer-y: 50%;">
      <section class="login-visual"><a class="brand login-brand" href="#"><span class="brand-mark">S</span><span>Student<span class="brand-light">OS</span></span></a><div class="login-message"><p class="eyebrow">Your personal college command center</p><h1>Your college life,<br><em>organized.</em></h1><p>Manage attendance, timetable, assignments and important college updates — all in one place.</p></div><div class="login-art" aria-hidden="true"><span class="art-ring"></span><span class="art-card art-card-one"></span><span class="art-card art-card-two"></span><span class="art-pencil"></span><span class="art-star">✦</span><span class="art-dot"></span></div><div class="login-orbit orbit-one"></div><div class="login-orbit orbit-two"></div><div class="login-visual-note"><span class="status-dot"></span> Your day, made clearer</div></section>
      <section class="login-panel"><div class="login-card"><div class="login-card-heading"><div class="login-kicker"><span class="kicker-dot"></span> Personal student workspace</div><h2>Welcome back</h2><p>Sign in to continue to StudentOS</p></div><form data-form="login" novalidate><label class="login-field ${invalidField === 'identifier' ? 'is-invalid' : ''}" for="login-identifier"><span class="field-icon" aria-hidden="true">@</span><span class="field-label">Email / Student ID</span><input id="login-identifier" name="identifier" type="text" autocomplete="username" placeholder=" " aria-describedby="login-error" required></label><label class="login-field ${invalidField === 'password' ? 'is-invalid' : ''}" for="login-password"><span class="field-icon" aria-hidden="true">⌑</span><span class="field-label">Password</span><span class="password-field"><input id="login-password" name="password" type="password" autocomplete="current-password" placeholder=" " aria-describedby="login-error" required><button type="button" class="show-password" data-action="toggle-password" aria-label="Show password">Show</button></span></label><div class="login-options"><label class="remember-option"><input name="remember" type="checkbox"><span class="checkbox"></span> Remember me</label><button type="button" class="login-link">Forgot password?</button></div><p class="login-error" id="login-error" role="alert">${escapeHtml(error)}</p><button class="primary-button login-submit" type="submit">Login <span>→</span></button></form><div class="login-assurance"><span>✓</span><span><strong>Ready when you are</strong><small>Your workspace stays saved on this device.</small></span></div><p class="signup-prompt">Don't have an account? <button type="button" class="login-link">Sign up</button></p></div><p class="login-footer">Private workspace · Saved on this device</p></section>
    </div>`
}

function renderDashboard() {
  const attendance = percentage()
  const pending = pendingTasks().sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
  document.querySelector('#app').innerHTML = `
    <header class="topbar"><a class="brand" href="#top"><span class="brand-mark">S</span><span>Student<span class="brand-light">OS</span></span></a><div class="topbar-tools"><label class="search-box"><span>⌕</span><input type="search" data-search placeholder="Search your day..." aria-label="Search your day"></label><span class="topbar-date">${today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span><button class="icon-button notification-button" aria-label="Notifications"><span class="notification-dot"></span>♧</button><button class="profile-chip" data-action="college-day"><span class="profile-avatar">AJ</span><span class="profile-name">Alex Johnson</span></button></div></header>
    <main id="top">
      <section class="welcome"><div><p class="eyebrow">${formatDate(today)}</p><h1>Your day, at a glance.</h1><p class="welcome-copy">A clear starting point for everything college throws your way.</p></div><button class="student-card" data-action="college-day"><span class="student-card-mark">AJ</span><span class="student-card-copy"><small>Student card</small><strong>Alex Johnson</strong><em>B.Tech Computer Science · Semester 5</em><b>${attendance.toFixed(1)}% attendance</b></span><span class="student-card-arrow">↗</span></button></section>
      <section class="summary-grid" aria-label="Today's summary">
        <article class="summary-card accent"><span class="summary-icon">◷</span><strong>${todayLectures.length}</strong><span>lectures today</span></article>
        <article class="summary-card"><span class="summary-icon">✓</span><strong>${pending.length}</strong><span>pending task${pending.length === 1 ? '' : 's'}</span></article>
        <article class="summary-card"><span class="summary-icon">!</span><strong>${state.notices.length}</strong><span>important notice${state.notices.length === 1 ? '' : 's'}</span></article>
        <article class="summary-card"><span class="summary-icon">%</span><strong>${attendance.toFixed(1)}%</strong><span>attendance</span></article>
      </section>
      <section class="quick-actions" aria-label="Quick actions"><span class="quick-label">Quick actions</span><button data-action="add-task"><span>＋</span> Add task</button><button data-action="edit-attendance"><span>◷</span> Mark attendance</button><button data-action="add-notice"><span>✦</span> Add notice</button><button data-action="view-timetable"><span>☷</span> View timetable</button></section>
      <div class="content-grid">
        <section class="panel schedule-panel" id="timetable"><div class="panel-heading"><div><p class="eyebrow">${todayName}</p><h2>Today's timetable</h2></div><span class="count-pill">${todayLectures.length} total</span></div>${isTodayHoliday() ? '<div class="empty-state"><span>🏖️</span><p>Today is a holiday. No attendance will be counted.</p></div>' : todayLectures.length ? `<div class="lecture-list">${todayLectures.map(lecture => `<div class="lecture"><div class="lecture-time">${escapeHtml(lecture.time)}</div><div class="lecture-line"></div><div class="lecture-details"><strong>${escapeHtml(lecture.subject)}</strong><span>${escapeHtml(lecture.room)}</span></div></div>`).join('')}</div>` : '<div class="empty-state"><span>☼</span><p>No lectures today. A good day to catch up.</p></div>'}</section>
        <section class="panel attendance-panel"><div class="panel-heading"><div><p class="eyebrow">Keep on track</p><h2>Attendance</h2></div><button class="text-button" data-action="edit-attendance">Edit</button></div><div class="attendance-number"><strong>${attendance.toFixed(1)}%</strong><span>target ${state.attendance.target}%</span></div><div class="progress-track"><span style="width: ${Math.min(attendance, 100)}%"></span><i style="left: ${state.attendance.target}%"></i></div><p class="helper-text">${attendanceMessage()}</p><div class="attendance-stats"><span><strong>${state.attendance.attended}</strong> attended</span><span><strong>${state.attendance.conducted}</strong> conducted</span></div></section>
        <section class="panel tasks-panel"><div class="panel-heading"><div><p class="eyebrow">Your workload</p><h2>Tasks</h2></div><button class="primary-button" data-action="add-task">+ Add task</button></div>${pending.length ? `<div class="task-list">${pending.slice(0, 5).map(task => `<label class="task-row"><input type="checkbox" data-task-id="${task.id}"><span class="checkbox"></span><span class="task-copy"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(dueText(task))}</small></span></label>`).join('')}</div>` : '<div class="empty-state"><span>✓</span><p>No pending tasks. You are all caught up.</p></div>'}<button class="secondary-button full-button" data-action="manage-tasks">${state.tasks.length > 5 ? 'View all tasks' : 'Add another task'}</button></section>
        <section class="panel notices-panel"><div class="panel-heading"><div><p class="eyebrow">Stay informed</p><h2>Important notices</h2></div><button class="text-button" data-action="add-notice">+ Add notice</button></div>${state.notices.length ? `<div class="notice-list">${state.notices.slice(0, 3).map(notice => `<article class="notice"><span class="notice-mark">!</span><div><strong>${escapeHtml(notice.title)}</strong><p>${escapeHtml(notice.details)}</p>${notice.deadline ? `<small>Deadline ${dateLabel(notice.deadline)}</small>` : ''}</div></article>`).join('')}</div>` : '<div class="empty-state"><span>!</span><p>No notices yet. Add the important ones here.</p></div>'}</section>
      </div>
    </main>
    <footer><span>StudentOS</span><span>Your personal college command center</span></footer>
    <div id="modal-root"></div>`
}

function showModal(type) {
  const isAttendance = type === 'attendance'
  const isCollegeDay = type === 'college-day'
  const day = state.collegeDay
  const collegeDayFields = `<div class="college-status"><label class="choice"><input type="radio" name="status" value="college" ${day.status !== 'holiday' ? 'checked' : ''}><span>🏫</span><strong>College today</strong></label><label class="choice"><input type="radio" name="status" value="holiday" ${day.status === 'holiday' ? 'checked' : ''}><span>🏖️</span><strong>Holiday</strong></label></div><div class="college-fields" ${day.status === 'holiday' ? 'hidden' : ''}><label>Lectures conducted today<input name="conducted" type="number" min="0" value="${day.conducted}" ${day.status === 'holiday' ? '' : 'required'}></label><label>Lectures attended today<input name="attended" type="number" min="0" value="${day.attended}" ${day.status === 'holiday' ? '' : 'required'}></label></div>`
  const content = isCollegeDay ? `<label>College start date<input name="startDate" type="date" value="${day.startDate}"></label><label>College end date<input name="endDate" type="date" value="${day.endDate}"></label><p class="form-error" role="alert"></p><p class="modal-section-label">Today's status</p>${collegeDayFields}` : isAttendance ? `<label>Lectures conducted<input name="conducted" type="number" min="0" value="${state.attendance.conducted}" required></label><label>Lectures attended<input name="attended" type="number" min="0" value="${state.attendance.attended}" required></label><label>Attendance target (%)<input name="target" type="number" min="1" max="100" value="${state.attendance.target}" required></label>` : type === 'task' ? `<label>Task name<input name="title" placeholder="e.g. DBMS Assignment 3" required></label><label>Due date<input name="dueDate" type="date"></label>` : `<label>Notice title<input name="title" placeholder="e.g. Mid-semester timetable" required></label><label>Details<textarea name="details" rows="3" placeholder="What should you remember?"></textarea></label><label>Deadline<input name="deadline" type="date"></label>`
  document.querySelector('#modal-root').innerHTML = `<div class="modal-backdrop"><form class="modal" data-form="${type}"><button type="button" class="close-button" data-action="close-modal" aria-label="Close">×</button><p class="eyebrow">Update your workspace</p><h2>${isCollegeDay ? 'College day setup' : isAttendance ? 'Attendance details' : type === 'task' ? 'Add a task' : 'Add a notice'}</h2>${isCollegeDay ? '<p class="modal-intro">Set your college dates and record what today looked like.</p>' : ''}${content}<button class="primary-button modal-submit" type="submit">Save ${isCollegeDay ? 'college day' : isAttendance ? 'attendance' : type}</button></form></div>`
}

document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action
  if (action === 'toggle-password') {
    const input = event.target.closest('.password-field')?.querySelector('input')
    if (input) { input.type = input.type === 'password' ? 'text' : 'password'; event.target.textContent = input.type === 'password' ? 'Show' : 'Hide' }
  }
  if (action === 'edit-attendance') showModal('attendance')
  if (action === 'college-day') showModal('college-day')
  if (action === 'add-task' || action === 'manage-tasks') showModal('task')
  if (action === 'add-notice') showModal('notice')
  if (action === 'view-timetable') document.querySelector('#timetable')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  if (action === 'close-modal' || event.target.classList.contains('modal-backdrop')) document.querySelector('#modal-root').innerHTML = ''
})

document.addEventListener('input', event => {
  if (!event.target.matches('[data-search]')) return
  const query = event.target.value.trim().toLowerCase()
  document.querySelectorAll('.lecture, .task-row, .notice').forEach(item => { item.hidden = query && !item.textContent.toLowerCase().includes(query) })
})

document.addEventListener('pointermove', event => {
  const shell = document.querySelector('.login-shell')
  if (!shell || event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  shell.style.setProperty('--pointer-x', `${event.clientX}px`)
  shell.style.setProperty('--pointer-y', `${event.clientY}px`)
})

document.addEventListener('change', event => {
  const form = event.target.closest('[data-form]')
  if (form?.dataset.form === 'college-day' && event.target.name === 'status') {
    const fields = form.querySelector('.college-fields')
    const isHoliday = event.target.value === 'holiday'
    fields.hidden = isHoliday
    fields.querySelectorAll('input').forEach(input => { input.required = !isHoliday })
  }
  const taskId = event.target.dataset.taskId
  if (taskId) { const task = state.tasks.find(item => item.id === taskId); if (task) task.completed = event.target.checked; save(); render() }
})

document.addEventListener('submit', event => {
  const form = event.target.closest('[data-form]')
  if (!form) return
  event.preventDefault()
  const values = Object.fromEntries(new FormData(form))
  if (form.dataset.form === 'login') {
    const identifier = values.identifier.trim()
    const error = !identifier ? 'Enter your email or student ID.' : !values.password ? 'Enter your password.' : identifier.includes('@') && !/^\S+@\S+\.\S+$/.test(identifier) ? 'Enter a valid email or student ID.' : ''
    const invalidField = !identifier || (identifier.includes('@') && !/^\S+@\S+\.\S+$/.test(identifier)) ? 'identifier' : 'password'
    if (error) { renderLogin(error, invalidField); return }
    const submitButton = form.querySelector('.login-submit')
    submitButton.disabled = true
    submitButton.classList.add('is-loading')
    submitButton.innerHTML = 'Signing in<span class="loading-dots">...</span>'
    setTimeout(() => {
      if (values.remember === 'on') { localStorage.setItem(sessionKey, 'remembered'); sessionStorage.removeItem(sessionKey) } else { sessionStorage.setItem(sessionKey, 'active'); localStorage.removeItem(sessionKey) }
      renderDashboard()
    }, 450)
    return
  }
  if (form.dataset.form === 'college-day') {
    const error = form.querySelector('.form-error')
    if (values.startDate && values.endDate && values.endDate < values.startDate) { error.textContent = 'End date cannot be before the start date.'; return }
    const status = values.status === 'holiday' ? 'holiday' : 'college'
    const conducted = status === 'college' ? Math.max(0, Number(values.conducted)) : 0
    const attended = status === 'college' ? Math.min(conducted, Math.max(0, Number(values.attended))) : 0
    state.collegeDay.startDate = values.startDate
    state.collegeDay.endDate = values.endDate
    applyTodayAttendance(status, conducted, attended)
  }
  if (form.dataset.form === 'attendance') state.attendance = { conducted: Math.max(0, Number(values.conducted)), attended: Math.min(Number(values.attended), Number(values.conducted)), target: Math.min(100, Math.max(1, Number(values.target))) }
  if (form.dataset.form === 'task') state.tasks.push({ id: crypto.randomUUID(), title: values.title, dueDate: values.dueDate, completed: false })
  if (form.dataset.form === 'notice') state.notices.unshift({ id: crypto.randomUUID(), title: values.title, details: values.details, deadline: values.deadline })
  save(); renderDashboard()
})

if (localStorage.getItem(sessionKey) === 'remembered' || sessionStorage.getItem(sessionKey) === 'active') renderDashboard()
else renderLogin()
