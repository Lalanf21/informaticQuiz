import bcrypt from 'bcrypt';
import { db } from './db';
import { migrate } from './migrate';

migrate();

db.exec(`
  DELETE FROM session_answers;
  DELETE FROM session_questions;
  DELETE FROM scores;
  DELETE FROM quiz_sessions;
  DELETE FROM questions;
  DELETE FROM topics;
  DELETE FROM teachers;
`);

const teacherHash = bcrypt.hashSync('guru123', 10);
db.prepare('INSERT INTO teachers (username, password_hash, name) VALUES (?,?,?)').run(
  'guru',
  teacherHash,
  'Guru Demo',
);

const topics = [
  { name: 'Algoritma & Pemrograman', grade: 7 },
  { name: 'Jaringan Komputer & Internet', grade: 8 },
  { name: 'Kewirausahaan Digital', grade: 9 },
];
for (const t of topics) {
  db.prepare('INSERT INTO topics (name, grade) VALUES (?,?)').run(t.name, t.grade);
}

const topicIds = db.prepare('SELECT id FROM topics ORDER BY id').all() as { id: number }[];

const questions = [
  // Topic 1: Algoritma (grade 7)
  {
    topicId: topicIds[0].id,
    type: 'pg',
    prompt: 'Apa itu algoritma?',
    data: {
      options: ['Urutan langkah logis', 'Bahasa pemrograman', 'Jenis komputer', 'Nama software'],
      correctIndex: 0,
    },
    difficulty: 'easy',
    points: 10,
  },
  {
    topicId: topicIds[0].id,
    type: 'tf',
    prompt: 'Flowchart adalah diagram alur.',
    data: { correctAnswer: true },
    difficulty: 'easy',
    points: 10,
  },
  {
    topicId: topicIds[0].id,
    type: 'ordering',
    prompt: 'Urutkan langkah algoritma memasak mie.',
    data: {
      correctOrder: ['Didihkan air', 'Masukkan mie', 'Tunggu 3 menit', 'Tiriskan', 'Sajikan'],
    },
    difficulty: 'medium',
    points: 15,
  },
  // Topic 2: Jaringan (grade 8)
  {
    topicId: topicIds[1].id,
    type: 'pg',
    prompt: 'HTTP adalah protokol?',
    data: { options: ['Transfer teks', 'Transfer hypertext', 'Email', 'File'], correctIndex: 1 },
    difficulty: 'easy',
    points: 10,
  },
  {
    topicId: topicIds[1].id,
    type: 'matching',
    prompt: 'Pasangkan istilah dengan definisi.',
    data: {
      pairs: [
        { left: 'HTTP', right: 'Protokol web' },
        { left: 'TCP', right: 'Pengiriman paket andal' },
        { left: 'IP', right: 'Pengalamatan perangkat' },
      ],
    },
    difficulty: 'medium',
    points: 15,
  },
  // Topic 3: Kewirausahaan (grade 9)
  {
    topicId: topicIds[2].id,
    type: 'pg',
    prompt: 'Apa kepanjangan UMKM?',
    data: {
      options: [
        'Usaha Mikro Kecil Menengah',
        'Usaha Modal Kecil Menengah',
        'Usaha Masyarakat Kecil Mandiri',
        'Unit Makmur Karya Mandiri',
      ],
      correctIndex: 0,
    },
    difficulty: 'easy',
    points: 10,
  },
];

for (const q of questions) {
  db.prepare(
    'INSERT INTO questions (topic_id, type, prompt, data, difficulty, points) VALUES (?,?,?,?,?,?)',
  ).run(q.topicId, q.type, q.prompt, JSON.stringify(q.data), q.difficulty, q.points);
}

console.log('Seed complete: 3 topics, 6 questions, 1 teacher (guru/guru123).');
