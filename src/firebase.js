import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, child, onValue, push, update, remove } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBXYCyp0zBMvjBGEkDxnbhnIutWl2TLGL4",
    authDomain: "nmims-labpulse.firebaseapp.com",
    projectId: "nmims-labpulse",
    storageBucket: "nmims-labpulse.firebasestorage.app",
    messagingSenderId: "1020040447173",
    appId: "1:1020040447173:web:5bb211e111535d698e5cac",
    measurementId: "G-7YEQVNNBBM",
    databaseURL: "https://nmims-labpulse-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Database helpers
export { ref, set, get, child, onValue, push, update, remove };
export { storageRef, uploadBytes, getDownloadURL };

// ==================== FACULTY FUNCTIONS ====================

export const createFaculty = async (facultyId, data) => {
    await set(ref(db, `faculty/${facultyId}`), {
        ...data,
        createdAt: Date.now()
    });
};

export const getFaculty = async (facultyId) => {
    const snapshot = await get(child(ref(db), `faculty/${facultyId}`));
    return snapshot.exists() ? snapshot.val() : null;
};

// ==================== STUDENT FUNCTIONS ====================

export const createStudent = async (sapId, data) => {
    await set(ref(db, `students/${sapId}`), {
        ...data,
        createdAt: Date.now()
    });
};

export const getStudent = async (sapId) => {
    const snapshot = await get(child(ref(db), `students/${sapId}`));
    return snapshot.exists() ? snapshot.val() : null;
};

export const updateStudent = async (sapId, data) => {
    await update(ref(db, `students/${sapId}`), data);
};

// ==================== SESSION FUNCTIONS ====================

export const createSession = async (sessionData) => {
    const sessionRef = push(ref(db, 'sessions'));
    const sessionId = sessionRef.key;

    await set(sessionRef, {
        ...sessionData,
        sessionId,
        status: 'active',
        createdAt: Date.now(),
        seats: {}
    });

    // Set active session for the lab
    await set(ref(db, `activeLabSessions/${sessionData.labId}`), sessionId);

    return sessionId;
};

export const getSession = async (sessionId) => {
    const snapshot = await get(child(ref(db), `sessions/${sessionId}`));
    return snapshot.exists() ? snapshot.val() : null;
};

export const getActiveSessionForLab = async (labId) => {
    const snapshot = await get(child(ref(db), `activeLabSessions/${labId}`));
    if (snapshot.exists()) {
        return await getSession(snapshot.val());
    }
    return null;
};

export const getAllActiveSessions = async () => {
    const snapshot = await get(child(ref(db), 'sessions'));
    if (!snapshot.exists()) return [];

    const sessions = snapshot.val();
    return Object.values(sessions).filter(s => s.status === 'active');
};

export const endSession = async (sessionId, marksData = {}) => {
    const session = await getSession(sessionId);
    if (session) {
        await update(ref(db, `sessions/${sessionId}`), {
            status: 'ended',
            endedAt: Date.now(),
            marks: marksData
        });
        await remove(ref(db, `activeLabSessions/${session.labId}`));
    }
};

// ==================== SEAT FUNCTIONS ====================

export const occupySeat = async (sessionId, seatNumber, studentData) => {
    await set(ref(db, `sessions/${sessionId}/seats/${seatNumber}`), {
        status: 'occupied',
        studentId: studentData.sapId,
        studentName: studentData.name,
        occupiedAt: Date.now(),
        submissions: []
    });
};

export const releaseSeat = async (sessionId, seatNumber) => {
    await update(ref(db, `sessions/${sessionId}/seats/${seatNumber}`), {
        status: 'empty',
        studentId: null,
        studentName: null
    });
};

export const switchSeat = async (sessionId, oldSeat, newSeat, studentData) => {
    // Get current seat data (preserve submissions)
    const snapshot = await get(child(ref(db), `sessions/${sessionId}/seats/${oldSeat}`));
    const oldSeatData = snapshot.exists() ? snapshot.val() : {};

    // Move to new seat with preserved data
    await set(ref(db, `sessions/${sessionId}/seats/${newSeat}`), {
        ...oldSeatData,
        status: oldSeatData.status || 'occupied',
        studentId: studentData.sapId,
        studentName: studentData.name,
        switchedAt: Date.now()
    });

    // Clear old seat
    await set(ref(db, `sessions/${sessionId}/seats/${oldSeat}`), {
        status: 'empty'
    });
};

// ==================== SUBMISSION FUNCTIONS ====================

export const addSubmission = async (sessionId, seatNumber, submission) => {
    const submissionRef = push(ref(db, `sessions/${sessionId}/seats/${seatNumber}/submissions`));
    await set(submissionRef, {
        ...submission,
        submissionId: submissionRef.key,
        uploadedAt: Date.now()
    });

    // Update seat status to submitted
    await update(ref(db, `sessions/${sessionId}/seats/${seatNumber}`), {
        status: 'submitted'
    });

    return submissionRef.key;
};

export const deleteSubmission = async (sessionId, seatNumber, submissionId) => {
    await remove(ref(db, `sessions/${sessionId}/seats/${seatNumber}/submissions/${submissionId}`));
};

export const updateSubmission = async (sessionId, seatNumber, submissionId, data) => {
    await update(ref(db, `sessions/${sessionId}/seats/${seatNumber}/submissions/${submissionId}`), data);
};

// ==================== FILE UPLOAD ====================

export const uploadFile = async (file, path) => {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
};

// ==================== REALTIME LISTENERS ====================

export const subscribeToSession = (sessionId, callback) => {
    return onValue(ref(db, `sessions/${sessionId}`), (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
    });
};

export const subscribeToSeats = (sessionId, callback) => {
    return onValue(ref(db, `sessions/${sessionId}/seats`), (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : {});
    });
};

// ==================== STATS FUNCTIONS ====================

export const getFacultyStats = async (facultyId) => {
    const snapshot = await get(child(ref(db), 'sessions'));
    if (!snapshot.exists()) return { completed: 0, total: 0 };

    const sessions = Object.values(snapshot.val());
    const facultySessions = sessions.filter(s => s.facultyId === facultyId);

    return {
        completed: facultySessions.filter(s => s.status === 'ended').length,
        total: facultySessions.length
    };
};

// ==================== MARKS & REPORTS ====================

export const updateStudentMarks = async (sessionId, seatNumber, marks) => {
    await update(ref(db, `sessions/${sessionId}/seats/${seatNumber}`), {
        marks: marks
    });
};

export const getSessionReport = async (sessionId) => {
    const session = await getSession(sessionId);
    if (!session) return null;

    const seats = session.seats || {};
    const reportData = [];

    Object.entries(seats).forEach(([seatNum, seatData]) => {
        if (seatData.studentId) {
            reportData.push({
                seatNumber: seatNum,
                sapId: seatData.studentId,
                studentName: seatData.studentName,
                submissions: Object.keys(seatData.submissions || {}).length,
                marks: seatData.marks || 0,
                status: seatData.status
            });
        }
    });

    return {
        sessionId: session.sessionId,
        title: session.title,
        subject: session.subject,
        facultyName: session.facultyName,
        year: session.year,
        division: session.division,
        semester: session.semester,
        labId: session.labId,
        createdAt: session.createdAt,
        endedAt: session.endedAt,
        students: reportData
    };
};

export const generateCSV = (reportData) => {
    if (!reportData || reportData.students.length === 0) return '';

    const headers = ['Seat Number', 'SAP ID', 'Student Name', 'Submissions', 'Marks', 'Status'];
    const rows = reportData.students.map(student => [
        student.seatNumber,
        student.sapId,
        student.studentName,
        student.submissions,
        student.marks,
        student.status
    ]);

    const csvContent = [
        ['Lab Report'],
        ['Session ID', reportData.sessionId],
        ['Title', reportData.title],
        ['Subject', reportData.subject],
        ['Faculty', reportData.facultyName],
        ['Year', reportData.year],
        ['Division', reportData.division],
        ['Lab', reportData.labId],
        [],
        headers,
        ...rows
    ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    return csvContent;
};

export const getSemesterReport = async (facultyId, year, semester) => {
    const snapshot = await get(child(ref(db), 'sessions'));
    if (!snapshot.exists()) return { students: {} };

    const allSessions = Object.values(snapshot.val());
    const sessionList = allSessions.filter(s => 
        s.facultyId === facultyId && 
        s.year === year && 
        s.semester === semester && 
        s.status === 'ended'
    );

    const studentMarks = {};

    // Collect all marks from sessions
    for (const session of sessionList) {
        const seats = session.seats || {};
        Object.entries(seats).forEach(([_, seatData]) => {
            if (seatData.studentId) {
                if (!studentMarks[seatData.studentId]) {
                    studentMarks[seatData.studentId] = {
                        sapId: seatData.studentId,
                        studentName: seatData.studentName,
                        labs: []
                    };
                }
                studentMarks[seatData.studentId].labs.push({
                    subject: session.subject,
                    marks: seatData.marks || 0
                });
            }
        });
    }

    return {
        year,
        semester,
        sessions: sessionList.length,
        students: Object.values(studentMarks)
    };
};

export default app;
