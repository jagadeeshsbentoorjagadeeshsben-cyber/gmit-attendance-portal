/**
 * GMIT SMART ATTENDANCE — Google Apps Script Web App
 * =====================================================
 * DEPLOY INSTRUCTIONS
 * 1. Open your Google Sheet "ATTENDENCE GMIT 2026 Odd Sem".
 * 2. Extensions -> Apps Script.
 * 3. Replace the entire Code.gs with THIS file. Save.
 * 4. Deploy -> Manage deployments -> (your existing Web App) -> Edit (pencil)
 *    -> New version -> Description "v2 full" -> Deploy.
 *    (Execute as: Me.  Who has access: Anyone.)
 * 5. Keep the SAME /exec URL — no env change needed.
 *
 * SHEET STRUCTURE (per section tab 3A/3B/5A/5B/7A/7B):
 *   Row 1 = Course Code (subject columns start at D)
 *   Row 2 = Teacher Name
 *   Row 3 = Classes Conducted
 *   Row 4 = Subject Name
 *   Row 5+ = Students   A=Serial  B=USN  C=Name  D+=attended counts
 *
 * An "Attendance_Log" sheet is auto-created for audit + undo.
 */

var SECTIONS = ['3A', '3B', '5A', '5B', '7A', '7B'];
var MIN_REQUIRED = 75;
var FIRST_SUBJECT_COL = 4; // column D
var FIRST_STUDENT_ROW = 5;
var LOG_SHEET = 'Attendance_Log';

/* ----------------------------- ROUTING ----------------------------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || 'health';
  try {
    switch (action) {
      case 'health': return json(health_());
      case 'sections': return json(sections_());
      case 'student': return json(student_(p.section, p.usn));
      case 'subjects': return json(subjects2_(p.section));
      case 'authorizesubject': return json(authorizeSubject_(p.section, p.courseCode));
      case 'facultysubjects': return json(facultySubjects_(p.teacher));
      case 'students': return json(students_(p.section, p.courseCode));
      case 'attendance': return json(attendanceForDate_(p.section, p.courseCode, p.date));
      case 'history': return json(history_(p.section, p.courseCode));
      default:
        return json({ success: false, error: 'Unknown action.',
          availableActions: ['health','sections','student','subjects','authorizesubject','facultysubjects','students','attendance','history'] });
    }
  } catch (err) {
    return json({ success: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json({ success: false, error: 'Invalid JSON body.' }); }
  var action = body.action;
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      switch (action) {
        case 'submitAttendance': return json(submitAttendance_(body));
        case 'updateAttendance': return json(updateAttendance_(body));
        case 'undoAttendance': return json(undoAttendance_(body));
        default: return json({ success: false, error: 'Unknown POST action.' });
      }
    } finally { lock.releaseLock(); }
  } catch (err) {
    return json({ success: false, error: String(err && err.message || err) });
  }
}

/* ----------------------------- HELPERS ----------------------------- */

function json(obj) {
  obj.updatedAt = obj.updatedAt || new Date().toISOString();
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheetFor_(section) {
  section = String(section || '').trim().toUpperCase();
  if (SECTIONS.indexOf(section) < 0) throw new Error('Invalid section.');
  var sh = ss_().getSheetByName(section);
  if (!sh) throw new Error('Section sheet not found.');
  return sh;
}

function round2_(n) { return Math.round(n * 100) / 100; }

function statusFor_(pct, isStarted) {
  if (!isStarted) return 'NOT_STARTED';
  if (pct >= 90) return 'EXCELLENT';
  if (pct >= MIN_REQUIRED) return 'ON_TRACK';
  if (pct >= 50) return 'AT_RISK';
  return 'CRITICAL';
}

function bufferFor_(attended, conducted) {
  if (conducted === 0) return { canMiss: 0, message: 'No classes conducted yet.' };
  var m = MIN_REQUIRED / 100;
  var canMiss = Math.max(0, Math.floor(attended / m - conducted));
  return {
    canMiss: canMiss,
    message: canMiss > 0
      ? 'You can miss approximately ' + canMiss + ' upcoming class' + (canMiss > 1 ? 'es' : '') + ' and remain at or above 75%.'
      : 'Missing the next class may take attendance below 75%.'
  };
}

function recoveryFor_(attended, conducted) {
  if (conducted === 0) return { needed: 0, message: 'Attendance will be calculated when classes begin.' };
  var pct = (attended / conducted) * 100;
  if (pct >= MIN_REQUIRED) return { needed: 0, message: 'You are already at or above the minimum requirement.' };
  var m = MIN_REQUIRED / 100;
  var need = Math.max(0, Math.ceil((m * conducted - attended) / (1 - m)));
  return { needed: need, message: 'Attend the next ' + need + ' class' + (need > 1 ? 'es' : '') + ' consecutively to reach approximately 75%.' };
}

/** Reads a section sheet into a structured object. */
function readSection_(section) {
  var sh = sheetFor_(section);
  var values = sh.getDataRange().getValues();
  var lastCol = sh.getLastColumn();
  var subjects = [];
  for (var c = FIRST_SUBJECT_COL - 1; c < lastCol; c++) {
    var code = String((values[0] && values[0][c]) || '').trim();
    var teacher = String((values[1] && values[1][c]) || '').trim();
    var conducted = Number((values[2] && values[2][c]) || 0) || 0;
    var subject = String((values[3] && values[3][c]) || '').trim();
    if (!subject && !code) continue;
    subjects.push({ col: c, courseCode: code, teacher: teacher, conducted: conducted, subject: subject });
  }
  var students = [];
  for (var r = FIRST_STUDENT_ROW - 1; r < values.length; r++) {
    var usn = String((values[r] && values[r][1]) || '').trim();
    if (!usn) continue;
    students.push({ row: r, usn: usn.toUpperCase(), name: String(values[r][2] || '').trim(), _vals: values[r] });
  }
  return { sheet: sh, values: values, subjects: subjects, students: students };
}

function findSubject_(sec, courseCode) {
  courseCode = String(courseCode || '').trim().toUpperCase();
  for (var i = 0; i < sec.subjects.length; i++) {
    if (String(sec.subjects[i].courseCode).toUpperCase() === courseCode) return sec.subjects[i];
  }
  return null;
}

/* ----------------------------- READ ACTIONS ----------------------------- */

function health_() {
  return { success: true, app: 'GMIT Attendance API', status: 'online', sections: SECTIONS };
}

function sections_() {
  var out = {};
  SECTIONS.forEach(function (s) {
    var sh = ss_().getSheetByName(s);
    out[s] = sh ? { available: true, rows: sh.getLastRow(), columns: sh.getLastColumn() } : { available: false };
  });
  return { success: true, sections: out };
}

function student_(section, usn) {
  usn = String(usn || '').trim().toUpperCase();
  var sec = readSection_(section);
  var stu = null;
  for (var i = 0; i < sec.students.length; i++) if (sec.students[i].usn === usn) { stu = sec.students[i]; break; }
  if (!stu) return { success: false, error: 'Student not found.', section: section, usn: usn };

  var subjects = [], totA = 0, totC = 0;
  sec.subjects.forEach(function (sub) {
    var attended = Number(stu._vals[sub.col] || 0) || 0;
    var conducted = sub.conducted;
    var isStarted = conducted > 0;
    var pct = isStarted ? round2_((attended / conducted) * 100) : 100;
    if (isStarted) { totA += attended; totC += conducted; }
    subjects.push({
      courseCode: sub.courseCode, subject: sub.subject, teacher: sub.teacher,
      attended: attended, conducted: conducted, percentage: pct,
      minimumRequired: MIN_REQUIRED, status: statusFor_(pct, isStarted), isStarted: isStarted,
      buffer: bufferFor_(attended, conducted), recovery: recoveryFor_(attended, conducted)
    });
  });
  var opct = totC > 0 ? round2_((totA / totC) * 100) : 0;
  return {
    success: true, minimumRequired: MIN_REQUIRED,
    student: { usn: stu.usn, name: stu.name, section: String(section).toUpperCase() },
    overall: { attended: totA, conducted: totC, percentage: opct, minimumRequired: MIN_REQUIRED, status: statusFor_(opct, totC > 0), isStarted: totC > 0 },
    subjects: subjects
  };
}

function subjects2_(section) {
  var sec = readSection_(section);
  var list = sec.subjects.map(function (s) {
    return { courseCode: s.courseCode, subject: s.subject, teacher: s.teacher, conducted: s.conducted };
  });
  return { success: true, section: String(section).toUpperCase(), subjects: list, studentCount: sec.students.length };
}

function authorizeSubject_(section, courseCode) {
  var sec = readSection_(section);
  var sub = findSubject_(sec, courseCode);
  if (!sub) return { success: false, error: 'Subject not found for this section.' };
  return { success: true, section: String(section).toUpperCase(), courseCode: sub.courseCode,
    subject: sub.subject, teacher: sub.teacher, conducted: sub.conducted, studentCount: sec.students.length };
}

function facultySubjects_(teacher) {
  teacher = String(teacher || '').trim().toLowerCase();
  if (!teacher) return { success: false, error: 'Teacher required.' };
  var out = [];
  SECTIONS.forEach(function (s) {
    var sh = ss_().getSheetByName(s); if (!sh) return;
    var sec = readSection_(s);
    sec.subjects.forEach(function (sub) {
      if (String(sub.teacher).trim().toLowerCase() === teacher) {
        out.push({ section: s, courseCode: sub.courseCode, subject: sub.subject, teacher: sub.teacher, conducted: sub.conducted });
      }
    });
  });
  return { success: true, teacher: teacher, subjects: out };
}

function students_(section, courseCode) {
  var sec = readSection_(section);
  var sub = findSubject_(sec, courseCode);
  if (!sub) return { success: false, error: 'Subject not found.' };
  var list = sec.students.map(function (stu, i) {
    var attended = Number(stu._vals[sub.col] || 0) || 0;
    var conducted = sub.conducted;
    var isStarted = conducted > 0;
    var pct = isStarted ? round2_((attended / conducted) * 100) : 100;
    return { serial: i + 1, usn: stu.usn, name: stu.name, attended: attended, conducted: conducted,
      percentage: pct, minimumRequired: MIN_REQUIRED, status: statusFor_(pct, isStarted), isStarted: isStarted,
      recovery: recoveryFor_(attended, conducted) };
  });
  return { success: true, section: String(section).toUpperCase(), courseCode: sub.courseCode,
    subject: sub.subject, teacher: sub.teacher, conducted: sub.conducted, students: list };
}

/* ----------------------------- LOG ----------------------------- */

function logSheet_() {
  var sh = ss_().getSheetByName(LOG_SHEET);
  if (!sh) {
    sh = ss_().insertSheet(LOG_SHEET);
    sh.appendRow(['Timestamp','Section','CourseCode','Subject','Teacher','Date','Operation',
      'ConductedBefore','ConductedAfter','StateJSON','PrevStateJSON','Undone','Note']);
  }
  return sh;
}

function logRows_() {
  var sh = logSheet_();
  var v = sh.getDataRange().getValues();
  var rows = [];
  for (var r = 1; r < v.length; r++) {
    rows.push({ row: r + 1, timestamp: v[r][0], section: v[r][1], courseCode: v[r][2], subject: v[r][3],
      teacher: v[r][4], date: v[r][5], operation: v[r][6], conductedBefore: v[r][7], conductedAfter: v[r][8],
      state: safeParse_(v[r][9]), prevState: safeParse_(v[r][10]), undone: v[r][11] === true || v[r][11] === 'TRUE', note: v[r][12] });
  }
  return rows;
}

function safeParse_(s) { try { return JSON.parse(s || '{}'); } catch (e) { return {}; } }

function appendLog_(o) {
  logSheet_().appendRow([new Date().toISOString(), o.section, o.courseCode, o.subject, o.teacher,
    o.date, o.operation, o.conductedBefore, o.conductedAfter, JSON.stringify(o.state || {}),
    JSON.stringify(o.prevState || {}), false, o.note || '']);
}

function sessionKeyMatch_(x, section, courseCode, date) {
  return String(x.section).toUpperCase() === String(section).toUpperCase() &&
         String(x.courseCode).toUpperCase() === String(courseCode).toUpperCase() &&
         String(x.date) === String(date);
}

/** latest non-undone operation for a session */
function latestOp_(section, courseCode, date) {
  var rows = logRows_(); var found = null;
  rows.forEach(function (x) {
    if (!x.undone && x.operation !== 'undo' && sessionKeyMatch_(x, section, courseCode, date)) found = x;
  });
  return found;
}

function anyActiveForSession_(section, courseCode, date) {
  // true if a submit exists that is not fully undone
  var rows = logRows_(); var active = false;
  rows.forEach(function (x) {
    if (sessionKeyMatch_(x, section, courseCode, date)) {
      if (x.operation === 'submit' && !x.undone) active = true;
      if (x.operation === 'undo') active = false;
    }
  });
  return active;
}

function markUndone_(rowNum) {
  logSheet_().getRange(rowNum, 12).setValue(true);
}

/* ----------------------------- WRITE ACTIONS ----------------------------- */

function normMap_(m) {
  var out = {};
  Object.keys(m || {}).forEach(function (k) {
    var v = String(m[k]).trim().toUpperCase();
    out[String(k).trim().toUpperCase()] = (v === 'P' || v === 'PRESENT') ? 'P' : 'A';
  });
  return out;
}

function submitAttendance_(body) {
  var section = body.section, courseCode = body.courseCode, date = body.date;
  var attendance = normMap_(body.attendance);
  if (!section || !courseCode || !date) return { success: false, error: 'section, courseCode and date are required.' };
  if (!Object.keys(attendance).length) return { success: false, error: 'No attendance provided.' };

  if (anyActiveForSession_(section, courseCode, date))
    return { success: false, error: 'Attendance already submitted for this date.', code: 'DUPLICATE' };

  var sec = readSection_(section);
  var sub = findSubject_(sec, courseCode);
  if (!sub) return { success: false, error: 'Subject not found.' };

  var conductedBefore = sub.conducted;
  var conductedAfter = conductedBefore + 1;
  sec.sheet.getRange(3, sub.col + 1).setValue(conductedAfter);

  var present = 0, absent = 0;
  sec.students.forEach(function (stu) {
    var mark = attendance[stu.usn];
    if (!mark) return;
    var cur = Number(stu._vals[sub.col] || 0) || 0;
    if (mark === 'P') { sec.sheet.getRange(stu.row + 1, sub.col + 1).setValue(cur + 1); present++; }
    else absent++;
  });

  appendLog_({ section: section, courseCode: sub.courseCode, subject: sub.subject, teacher: sub.teacher,
    date: date, operation: 'submit', conductedBefore: conductedBefore, conductedAfter: conductedAfter,
    state: attendance, prevState: {} });

  return { success: true, operation: 'submit', section: String(section).toUpperCase(), courseCode: sub.courseCode,
    date: date, conducted: conductedAfter, present: present, absent: absent, total: present + absent };
}

function updateAttendance_(body) {
  var section = body.section, courseCode = body.courseCode, date = body.date;
  var attendance = normMap_(body.attendance);
  if (!section || !courseCode || !date) return { success: false, error: 'section, courseCode and date are required.' };

  var last = latestOp_(section, courseCode, date);
  if (!last) return { success: false, error: 'No submitted attendance found for this date.' };

  var sec = readSection_(section);
  var sub = findSubject_(sec, courseCode);
  if (!sub) return { success: false, error: 'Subject not found.' };

  var prev = last.state || {};
  var present = 0, absent = 0;
  sec.students.forEach(function (stu) {
    var nw = attendance[stu.usn];
    if (!nw) return;
    var old = prev[stu.usn] || 'A';
    var cur = Number(stu._vals[sub.col] || 0) || 0;
    var delta = (nw === 'P' ? 1 : 0) - (old === 'P' ? 1 : 0);
    if (delta !== 0) sec.sheet.getRange(stu.row + 1, sub.col + 1).setValue(Math.max(0, cur + delta));
    if (nw === 'P') present++; else absent++;
  });

  appendLog_({ section: section, courseCode: sub.courseCode, subject: sub.subject, teacher: sub.teacher,
    date: date, operation: 'edit', conductedBefore: sub.conducted, conductedAfter: sub.conducted,
    state: attendance, prevState: prev });

  return { success: true, operation: 'edit', section: String(section).toUpperCase(), courseCode: sub.courseCode,
    date: date, conducted: sub.conducted, present: present, absent: absent, total: present + absent };
}

function undoAttendance_(body) {
  var section = body.section, courseCode = body.courseCode, date = body.date;
  if (!section || !courseCode || !date) return { success: false, error: 'section, courseCode and date are required.' };

  var last = latestOp_(section, courseCode, date);
  if (!last) return { success: false, error: 'Attendance has already been undone.', code: 'ALREADY_UNDONE' };

  var sec = readSection_(section);
  var sub = findSubject_(sec, courseCode);
  if (!sub) return { success: false, error: 'Subject not found.' };

  if (last.operation === 'submit') {
    var conductedAfter = Math.max(0, sub.conducted - 1);
    sec.sheet.getRange(3, sub.col + 1).setValue(conductedAfter);
    var st = last.state || {};
    sec.students.forEach(function (stu) {
      if (st[stu.usn] === 'P') {
        var cur = Number(stu._vals[sub.col] || 0) || 0;
        sec.sheet.getRange(stu.row + 1, sub.col + 1).setValue(Math.max(0, cur - 1));
      }
    });
    markUndone_(last.row);
    appendLog_({ section: section, courseCode: sub.courseCode, subject: sub.subject, teacher: sub.teacher,
      date: date, operation: 'undo', conductedBefore: sub.conducted, conductedAfter: conductedAfter,
      state: {}, prevState: st, note: 'undo submit' });
    return { success: true, operation: 'undo', undone: 'submit', conducted: conductedAfter };
  }

  // undo an edit: revert attended to prevState using current(state) vs prevState
  var cur2 = last.state || {}, prev2 = last.prevState || {};
  sec.students.forEach(function (stu) {
    var nowMark = cur2[stu.usn]; var oldMark = prev2[stu.usn];
    if (nowMark === undefined && oldMark === undefined) return;
    var delta = ((oldMark === 'P' ? 1 : 0) - (nowMark === 'P' ? 1 : 0));
    if (delta !== 0) {
      var cur = Number(stu._vals[sub.col] || 0) || 0;
      sec.sheet.getRange(stu.row + 1, sub.col + 1).setValue(Math.max(0, cur + delta));
    }
  });
  markUndone_(last.row);
  appendLog_({ section: section, courseCode: sub.courseCode, subject: sub.subject, teacher: sub.teacher,
    date: date, operation: 'undo', conductedBefore: sub.conducted, conductedAfter: sub.conducted,
    state: prev2, prevState: cur2, note: 'undo edit' });
  return { success: true, operation: 'undo', undone: 'edit', conducted: sub.conducted };
}

/* ----------------------------- HISTORY / DATE ----------------------------- */

function attendanceForDate_(section, courseCode, date) {
  var last = latestOp_(section, courseCode, date);
  var sec = readSection_(section);
  var sub = findSubject_(sec, courseCode);
  if (!sub) return { success: false, error: 'Subject not found.' };
  if (!last) return { success: true, submitted: false, section: String(section).toUpperCase(),
    courseCode: sub.courseCode, subject: sub.subject, teacher: sub.teacher, date: date, attendance: {} };
  return { success: true, submitted: true, section: String(section).toUpperCase(), courseCode: sub.courseCode,
    subject: sub.subject, teacher: sub.teacher, date: date, conducted: sub.conducted, attendance: last.state || {} };
}

function history_(section, courseCode) {
  var rows = logRows_();
  var out = [];
  rows.forEach(function (x) {
    if (section && String(x.section).toUpperCase() !== String(section).toUpperCase()) return;
    if (courseCode && String(x.courseCode).toUpperCase() !== String(courseCode).toUpperCase()) return;
    if (x.operation === 'undo') return;
    var st = x.state || {}; var present = 0, absent = 0;
    Object.keys(st).forEach(function (k) { if (st[k] === 'P') present++; else absent++; });
    out.push({ timestamp: x.timestamp, date: x.date, section: x.section, courseCode: x.courseCode,
      subject: x.subject, teacher: x.teacher, operation: x.operation, present: present, absent: absent,
      total: present + absent, conducted: x.conductedAfter, undone: x.undone });
  });
  out.reverse();
  return { success: true, history: out };
}
