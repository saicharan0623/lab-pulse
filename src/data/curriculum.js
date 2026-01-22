export const curriculum = {
  years: [
    { id: 1, label: 'Year 1' },
    { id: 2, label: 'Year 2' },
    { id: 3, label: 'Year 3' },
    { id: 4, label: 'Year 4' }
  ],
  divisions: [
    { id: 'A', label: 'Division A' },
    { id: 'B', label: 'Division B' },
    { id: 'C', label: 'Division C' }
  ],
  semesters: {
    1: [
      { id: 1, label: 'Semester 1', subjects: ['calculus', 'beee', 'pps', 'bio', 'egd'] },
      { id: 2, label: 'Semester 2', subjects: ['lade', 'physics', 'python', 'design thinking', 'eews'] }
    ],
    2: [
      { id: 3, label: 'Semester 3', subjects: ['dm', 'dsa', 'om', 'ps', 'dw'] },
      { id: 4, label: 'Semester 4', subjects: ['dbms', 'idsia', 'sm', 'web programming', 'dhv'] }
    ],
    3: [
      { id: 5, label: 'Semester 5', subjects: ['arvr', 'cem', 'cn', 'ddpa', 'os', 'se'] },
      { id: 6, label: 'Semester 6', subjects: ['aai', 'adsa', 'fimis', 'is', 'nndl', 'predictive analysis', 'vcc'] }
    ],
    4: [
      { id: 7, label: 'Semester 7', subjects: ['nlp', 'cns', 'iot', 'bda', 'cc'] },
      { id: 8, label: 'Semester 8', subjects: [] } // No lab for sem 8
    ]
  },
  subjectMap: {
    // Year 1
    'calculus': { year: 1, semester: 1, label: 'Calculus' },
    'beee': { year: 1, semester: 1, label: 'BEEE' },
    'pps': { year: 1, semester: 1, label: 'PPS' },
    'bio': { year: 1, semester: 1, label: 'Biology' },
    'egd': { year: 1, semester: 1, label: 'EGD' },
    'lade': { year: 1, semester: 2, label: 'LADE' },
    'physics': { year: 1, semester: 2, label: 'Physics' },
    'python': { year: 1, semester: 2, label: 'Python' },
    'design thinking': { year: 1, semester: 2, label: 'Design Thinking' },
    'eews': { year: 1, semester: 2, label: 'EEWS' },
    // Year 2
    'dm': { year: 2, semester: 3, label: 'DM' },
    'dsa': { year: 2, semester: 3, label: 'DSA' },
    'om': { year: 2, semester: 3, label: 'OM' },
    'ps': { year: 2, semester: 3, label: 'PS' },
    'dw': { year: 2, semester: 3, label: 'DW' },
    'dbms': { year: 2, semester: 4, label: 'DBMS' },
    'idsia': { year: 2, semester: 4, label: 'IDSIA' },
    'sm': { year: 2, semester: 4, label: 'SM' },
    'web programming': { year: 2, semester: 4, label: 'Web Programming' },
    'dhv': { year: 2, semester: 4, label: 'DHV' },
    // Year 3
    'arvr': { year: 3, semester: 5, label: 'AR/VR' },
    'cem': { year: 3, semester: 5, label: 'CEM' },
    'cn': { year: 3, semester: 5, label: 'CN' },
    'ddpa': { year: 3, semester: 5, label: 'DDPA' },
    'os': { year: 3, semester: 5, label: 'OS' },
    'se': { year: 3, semester: 5, label: 'SE' },
    'aai': { year: 3, semester: 6, label: 'AAI' },
    'adsa': { year: 3, semester: 6, label: 'ADSA' },
    'fimis': { year: 3, semester: 6, label: 'FIMIS' },
    'is': { year: 3, semester: 6, label: 'IS' },
    'nndl': { year: 3, semester: 6, label: 'NNDL' },
    'predictive analysis': { year: 3, semester: 6, label: 'Predictive Analysis' },
    'vcc': { year: 3, semester: 6, label: 'VCC' },
    // Year 4
    'nlp': { year: 4, semester: 7, label: 'NLP' },
    'cns': { year: 4, semester: 7, label: 'CNS' },
    'iot': { year: 4, semester: 7, label: 'IoT' },
    'bda': { year: 4, semester: 7, label: 'BDA' },
    'cc': { year: 4, semester: 7, label: 'CC' }
  }
};

export const getSubjectsForYear = (year) => {
  if (!curriculum.semesters[year]) return [];
  return curriculum.semesters[year];
};

export const getSubjectsForSemester = (year, semester) => {
  const semesters = curriculum.semesters[year];
  if (!semesters) return [];
  const sem = semesters.find(s => s.id === semester);
  return sem?.subjects || [];
};

export const formatSubjectLabel = (subject) => {
  return curriculum.subjectMap[subject.toLowerCase()]?.label || subject;
};
