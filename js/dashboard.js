document.addEventListener('DOMContentLoaded', () => {
  const dashboard = document.querySelector('.dashboard-layout');
  if (!dashboard) return;

  const keys = {
    profile: 'pulse-athletics-profile',
    workouts: 'pulse-athletics-workouts',
    bookings: 'pulse-athletics-bookings',
    schedule: 'pulse-athletics-schedule',
    messages: 'pulse-athletics-messages'
  };
  const defaultProfile = {
    name: 'Member',
    email: 'member@pulseathletics.com',
    weight: 72,
    height: 175,
    goal: 'Build strength',
    plan: 'Pro'
  };
  const profileNotice = document.getElementById('settings-notice');
  const workoutNotice = document.getElementById('workout-notice');
  const bookingNotice = document.getElementById('booking-notice');
  const scheduleNotice = document.getElementById('schedule-notice');
  const contactNotice = document.getElementById('contact-notice');
  const membershipNotice = document.getElementById('membership-notice');

  function readStored(key, fallback, isValid) {
    let raw;
    try {
      raw = localStorage.getItem(key);
    } catch (error) {
      console.error(`Unable to access saved data for ${key}.`, error);
      return Array.isArray(fallback) ? [] : { ...fallback };
    }
    if (!raw) return Array.isArray(fallback) ? [] : { ...fallback };
    try {
      const value = JSON.parse(raw);
      if (isValid(value)) return value;
      console.error(`Saved data for ${key} has an invalid shape.`);
    } catch (error) {
      console.error(`Unable to parse saved data for ${key}.`, error);
    }
    return Array.isArray(fallback) ? [] : { ...fallback };
  }

  function saveStored(key, value, notice) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Unable to save ${key} to local storage.`, error);
      if (notice) notice.textContent = 'This browser could not save your changes.';
      return false;
    }
  }

  const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const validWorkout = (value) => Array.isArray(value) && value.every((item) => (
    item && typeof item.name === 'string' && typeof item.type === 'string' &&
    Number.isFinite(Number(item.duration)) && Number.isFinite(Number(item.calories)) && isDate(item.date)
  ));
  const validEvents = (value) => Array.isArray(value) && value.every((item) => (
    item && typeof item.title === 'string' && typeof item.type === 'string' &&
    isDate(item.date) && /^\d{2}:\d{2}$/.test(item.time)
  ));
  const validProfile = (value) => (
    value && typeof value === 'object' && typeof value.name === 'string' &&
    typeof value.email === 'string' && Number.isFinite(Number(value.weight)) &&
    Number.isFinite(Number(value.height)) && typeof value.goal === 'string'
  );
  const validMessages = (value) => Array.isArray(value) && value.every((item) => (
    item && typeof item.name === 'string' && typeof item.email === 'string' &&
    typeof item.topic === 'string' && typeof item.message === 'string'
  ));

  let profile = readStored(keys.profile, defaultProfile, validProfile);
  let workouts = readStored(keys.workouts, [], validWorkout);
  let bookings = readStored(keys.bookings, [], validEvents);
  let scheduleItems = readStored(keys.schedule, [], validEvents);
  let messages = readStored(keys.messages, [], validMessages);
  profile = { ...defaultProfile, ...profile, plan: profile.plan || 'Pro' };
  workouts = workouts.map((item) => ({ id: item.id || createId(), ...item }));
  bookings = bookings.map((item) => ({ id: item.id || createId(), ...item }));
  scheduleItems = scheduleItems.map((item) => ({ id: item.id || createId(), ...item }));
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let selectedDate = dateString(new Date());

  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function dateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
  }

  function eventDateTime(item) {
    return `${item.date}T${item.time}`;
  }

  function isFutureDateTime(date, time) {
    return new Date(`${date}T${time}`).getTime() > Date.now();
  }

  function showView(name, updateHash = true) {
    const selected = document.getElementById(name);
    if (!selected || !selected.classList.contains('dashboard-view')) return;
    document.querySelectorAll('.dashboard-view').forEach((view) => {
      view.hidden = view !== selected;
    });
    document.querySelectorAll('[data-tab]').forEach((button) => {
      const active = button.dataset.tab === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    if (updateHash && location.hash !== `#${name}`) history.replaceState(null, '', `#${name}`);
    document.querySelector('.dashboard-main').scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      showView(button.dataset.tab);
      document.getElementById('dashboard-sidebar').classList.remove('menu-open');
      document.getElementById('sidebar-toggle').setAttribute('aria-expanded', 'false');
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...document.querySelectorAll('[data-tab]')];
      const index = tabs.indexOf(button);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      tabs[(index + direction + tabs.length) % tabs.length].focus();
    });
  });
  function activateHashView() {
    const requestedView = location.hash.slice(1);
    const requestedElement = document.getElementById(requestedView);
    const viewName = requestedElement?.classList.contains('dashboard-view')
      ? requestedView
      : ['privacy', 'cookies'].includes(requestedView) ? 'terms' : null;

    if (!viewName) return false;
    showView(viewName, false);
    if (viewName !== requestedView) {
      requestAnimationFrame(() => requestedElement?.scrollIntoView({ block: 'start' }));
    }
    return true;
  }

  window.addEventListener('hashchange', activateHashView);
  if (!activateHashView()) showView('overview', false);

  const sidebar = document.getElementById('dashboard-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.addEventListener('click', () => {
    const expanded = sidebar.classList.toggle('menu-open');
    sidebarToggle.setAttribute('aria-expanded', String(expanded));
  });

  function renderProfile() {
    const name = profile.name.trim() || defaultProfile.name;
    const plan = ['Basic', 'Pro', 'Premium'].includes(profile.plan) ? profile.plan : 'Pro';
    const planDetails = {
      Basic: { benefits: 'Gym access and member portal', trainer: 'Book separately', classes: 'Standard' },
      Pro: { benefits: 'Personal trainer support and group classes', trainer: 'Included', classes: 'Included' },
      Premium: { benefits: 'All Pro benefits and exclusive events', trainer: 'Priority access', classes: 'Unlimited' }
    }[plan];
    profile.plan = plan;
    document.getElementById('welcome-name').textContent = name.split(/\s+/)[0];
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-email').textContent = profile.email;
    document.getElementById('profile-initials').textContent = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
    document.getElementById('profile-weight').textContent = `${profile.weight} kg`;
    document.getElementById('profile-height').textContent = `${profile.height} cm`;
    document.getElementById('profile-goal').textContent = profile.goal;
    document.getElementById('member-name').value = profile.name;
    document.getElementById('member-email').value = profile.email;
    document.getElementById('member-weight').value = profile.weight;
    document.getElementById('member-height').value = profile.height;
    document.getElementById('member-goal').value = profile.goal;
    document.getElementById('contact-name').value = profile.name;
    document.getElementById('contact-email').value = profile.email;
    document.getElementById('membership-value').textContent = profile.plan;
    document.getElementById('plan-name').textContent = `${profile.plan} Member`;
    document.getElementById('plan-benefits').textContent = planDetails.benefits;
    document.getElementById('plan-trainer-access').textContent = planDetails.trainer;
    document.getElementById('plan-classes').textContent = planDetails.classes;
    document.getElementById('membership-plan').value = profile.plan;
  }

  function renderWorkouts() {
    const list = document.getElementById('workout-list');
    list.replaceChildren();
    if (!workouts.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No workouts logged yet. Add your first session above.';
      list.append(empty);
      return;
    }
    [...workouts].sort((a, b) => b.date.localeCompare(a.date)).forEach((workout) => {
      const row = document.createElement('div');
      row.className = 'dashboard-row';
      const details = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = workout.name;
      const subline = document.createElement('small');
      subline.textContent = `${workout.type} · ${workout.duration} min · ${formatDate(workout.date)}`;
      details.append(title, subline);
      const meta = document.createElement('span');
      meta.className = 'row-meta';
      meta.textContent = `${workout.calories} kcal`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove workout ${workout.name}`);
      remove.addEventListener('click', () => {
        workouts = workouts.filter((item) => item.id !== workout.id);
        saveStored(keys.workouts, workouts, workoutNotice);
        renderAll();
      });
      meta.append(remove);
      row.append(details, meta);
      list.append(row);
    });
  }

  function renderMetrics() {
    const now = new Date();
    const monthItems = workouts.filter((item) => {
      const [year, month] = item.date.split('-').map(Number);
      return year === now.getFullYear() && month === now.getMonth() + 1;
    });
    const calories = monthItems.reduce((sum, item) => sum + Number(item.calories), 0);
    document.getElementById('sessions-value').textContent = String(monthItems.length);
    document.getElementById('calories-value').textContent = `${calories.toLocaleString()} kcal`;
    document.getElementById('goal-count').textContent = String(monthItems.length);
    document.getElementById('goal-progress').setAttribute('aria-valuenow', String(Math.min(monthItems.length, 12)));
    document.querySelector('#goal-progress span').style.width = `${Math.min(monthItems.length / 12 * 100, 100)}%`;
    document.getElementById('goal-note').textContent = monthItems.length >= 12
      ? 'Monthly goal reached. Excellent work!'
      : `${12 - monthItems.length} sessions to reach your monthly goal.`;
    const dates = new Set(workouts.map((item) => item.date));
    let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!dates.has(dateString(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (dates.has(dateString(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    document.getElementById('streak-value').textContent = `${streak} day${streak === 1 ? '' : 's'}`;
  }

  function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const days = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const prevDays = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 0).getDate();
    const eventDates = new Set([
      ...workouts.map((item) => item.date),
      ...bookings.map((item) => item.date),
      ...scheduleItems.map((item) => item.date)
    ]);
    grid.replaceChildren();
    document.getElementById('calendar-month').textContent = calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((day) => {
      const label = document.createElement('span');
      label.className = 'calendar-weekday';
      label.setAttribute('role', 'columnheader');
      label.textContent = day;
      grid.append(label);
    });
    for (let index = 0; index < 42; index += 1) {
      let dayDate;
      let outside = false;
      if (index < offset) {
        dayDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, prevDays - offset + index + 1);
        outside = true;
      } else if (index >= offset + days) {
        dayDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, index - offset - days + 1);
        outside = true;
      } else {
        dayDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - offset + 1);
      }
      const value = dateString(dayDate);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'calendar-day';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', formatDate(value, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
      cell.textContent = String(dayDate.getDate());
      if (outside) cell.classList.add('outside-month');
      if (value === dateString(new Date())) cell.classList.add('today');
      if (value === selectedDate) cell.classList.add('selected');
      if (eventDates.has(value)) cell.classList.add('has-event');
      cell.addEventListener('click', () => {
        selectedDate = value;
        renderCalendar();
      });
      grid.append(cell);
    }
    const selectedEvents = [
      ...workouts.filter((item) => item.date === selectedDate).map((item) => item.name),
      ...bookings.filter((item) => item.date === selectedDate).map((item) => `${item.title} (${item.time})`),
      ...scheduleItems.filter((item) => item.date === selectedDate).map((item) => `${item.title} (${item.time})`)
    ];
    document.getElementById('calendar-selection').textContent = selectedEvents.length
      ? `${formatDate(selectedDate)} · ${selectedEvents.join(', ')}`
      : `${formatDate(selectedDate)} · No sessions scheduled`;
  }

  function renderSchedule() {
    const list = document.getElementById('schedule-list');
    const events = [
      ...bookings.map((item) => ({ ...item, category: 'Trainer booking', storage: 'booking' })),
      ...scheduleItems.map((item) => ({ ...item, category: item.type, storage: 'schedule' }))
    ].filter((item) => eventDateTime(item) >= `${dateString(new Date())}T00:00`)
      .sort((a, b) => eventDateTime(a).localeCompare(eventDateTime(b)));
    list.replaceChildren();
    if (!events.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No upcoming sessions. Book a trainer or add an activity to your schedule.';
      list.append(empty);
      return;
    }
    events.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'dashboard-row';
      const details = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const subline = document.createElement('small');
      subline.textContent = `${item.category} · ${formatDate(item.date)} · ${item.time}`;
      details.append(title, subline);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-button';
      remove.textContent = 'Cancel';
      remove.setAttribute('aria-label', `Cancel ${item.title}`);
      remove.addEventListener('click', () => {
        if (item.storage === 'booking') {
          bookings = bookings.filter((entry) => entry.id !== item.id);
          saveStored(keys.bookings, bookings, scheduleNotice);
        } else {
          scheduleItems = scheduleItems.filter((entry) => entry.id !== item.id);
          saveStored(keys.schedule, scheduleItems, scheduleNotice);
        }
        renderAll();
      });
      row.append(details, remove);
      list.append(row);
    });
  }

  function renderAll() {
    renderWorkouts();
    renderMetrics();
    renderCalendar();
    renderSchedule();
  }

  document.getElementById('workout-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const item = {
      id: createId(),
      name: String(data.get('name')).trim(),
      type: String(data.get('type')),
      duration: Number(data.get('duration')),
      calories: Number(data.get('calories')),
      date: String(data.get('date'))
    };
    if (!item.name || !Number.isFinite(item.duration) || !Number.isFinite(item.calories)) {
      workoutNotice.textContent = 'Enter a workout name, duration, and calorie estimate.';
      return;
    }
    workouts.push(item);
    const saved = saveStored(keys.workouts, workouts, workoutNotice);
    workoutNotice.textContent = saved ? 'Workout saved.' : 'Workout added for this session but not saved in this browser.';
    form.reset();
    document.getElementById('workout-date').value = dateString(new Date());
    renderAll();
  });

  document.querySelectorAll('.choose-trainer').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('booking-trainer').value = button.closest('[data-trainer]').dataset.trainer;
      document.getElementById('booking-date').focus();
      document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  document.getElementById('booking-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const trainer = String(data.get('trainer'));
    const date = String(data.get('date'));
    const time = String(data.get('time'));
    if (!trainer || !isFutureDateTime(date, time)) {
      bookingNotice.textContent = 'Choose a trainer and a future date and time.';
      return;
    }
    if (bookings.some((item) => item.date === date && item.time === time && item.title === `${trainer} · ${data.get('type')}`)) {
      bookingNotice.textContent = 'You already have this trainer session booked at that time.';
      return;
    }
    bookings.push({
      id: createId(),
      title: `${trainer} · ${String(data.get('type'))}`,
      type: 'Trainer booking',
      date,
      time
    });
    const saved = saveStored(keys.bookings, bookings, bookingNotice);
    bookingNotice.textContent = saved ? 'Trainer session added to your schedule.' : 'Session added for this visit but not saved in this browser.';
    form.reset();
    document.getElementById('booking-date').value = dateString(new Date());
    renderAll();
  });

  document.getElementById('schedule-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const date = String(data.get('date'));
    if (!isFutureDateTime(date, String(data.get('time')))) {
      scheduleNotice.textContent = 'Choose a future date and time for a scheduled activity.';
      return;
    }
    scheduleItems.push({
      id: createId(),
      title: String(data.get('title')).trim(),
      type: String(data.get('type')),
      date,
      time: String(data.get('time'))
    });
    const saved = saveStored(keys.schedule, scheduleItems, scheduleNotice);
    scheduleNotice.textContent = saved ? 'Activity added to your schedule.' : 'Activity added for this visit but not saved in this browser.';
    form.reset();
    document.getElementById('schedule-date').value = dateString(new Date());
    renderAll();
  });

  document.getElementById('settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    profile = {
      ...profile,
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim(),
      weight: Number(data.get('weight')),
      height: Number(data.get('height')),
      goal: String(data.get('goal')).trim()
    };
    if (!profile.name || !profile.goal || !Number.isFinite(profile.weight) || !Number.isFinite(profile.height)) {
      profileNotice.textContent = 'Enter valid profile details before saving.';
      return;
    }
    const saved = saveStored(keys.profile, profile, profileNotice);
    renderProfile();
    profileNotice.textContent = saved ? 'Profile saved on this device.' : 'Profile updated for this visit but not saved in this browser.';
  });

  document.getElementById('membership-form').addEventListener('submit', (event) => {
    event.preventDefault();
    profile.plan = String(new FormData(event.currentTarget).get('plan'));
    const saved = saveStored(keys.profile, profile, membershipNotice);
    renderProfile();
    membershipNotice.textContent = saved ? 'Plan preference saved in this browser.' : 'Plan preference updated for this visit only.';
  });

  document.getElementById('contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    messages.push({
      id: createId(),
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim(),
      topic: String(data.get('topic')),
      message: String(data.get('message')).trim()
    });
    const saved = saveStored(keys.messages, messages, contactNotice);
    contactNotice.textContent = saved
      ? 'Message saved in this browser. It has not been sent to a support team.'
      : 'Message recorded for this visit only; this browser could not save it.';
    form.reset();
    renderProfile();
  });

  document.getElementById('calendar-prev').addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById('calendar-next').addEventListener('click', () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  document.querySelectorAll('.faq-question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const active = item.classList.toggle('active');
      button.setAttribute('aria-expanded', String(active));
    });
  });

  const today = dateString(new Date());
  document.getElementById('dashboard-date').textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  ['workout-date', 'booking-date', 'schedule-date'].forEach((id) => {
    const input = document.getElementById(id);
    input.value = today;
  });
  document.getElementById('workout-date').max = today;
  document.getElementById('booking-date').min = today;
  document.getElementById('schedule-date').min = today;
  renderProfile();
  renderAll();
});
