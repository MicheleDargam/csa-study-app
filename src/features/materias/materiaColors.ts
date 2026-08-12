export const MATERIA_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Índigo', value: '#6366f1' },
] as const;

// Pré-cadastrados no primeiro uso, mas totalmente editáveis/removíveis pelo
// usuário depois. Os nomes são exatamente os mesmos "temas" usados para
// marcar as questões no Banco de Questões (ver src/data/simulados e
// src/data/avulsas) — assim "Horas por matéria" (Timer/Progresso) e
// "Desempenho por tema" (Banco de Questões/Progresso) falam a mesma língua
// em vez de serem duas taxonomias soltas. Ver migrateMateriasParaTemas em
// src/db/seed.ts para quem já tinha a lista antiga.
export const DEFAULT_MATERIAS = [
  { name: 'Application Scope', color: '#3b82f6' },
  { name: 'CMDB', color: '#8b5cf6' },
  { name: 'Data Management (Import Sets)', color: '#ec4899' },
  { name: 'Database/Tables', color: '#ef4444' },
  { name: 'Integrations (Flow Designer)', color: '#f97316' },
  { name: 'Knowledge Management', color: '#eab308' },
  { name: 'Notifications', color: '#22c55e' },
  { name: 'Reporting', color: '#14b8a6' },
  { name: 'Scripting/Client Development', color: '#06b6d4' },
  { name: 'Security/ACL', color: '#6366f1' },
  { name: 'Service Catalog', color: '#3b82f6' },
  { name: 'System Administration', color: '#8b5cf6' },
  { name: 'Task Management', color: '#ec4899' },
  { name: 'UI Fundamentals', color: '#ef4444' },
  { name: 'Update Sets', color: '#f97316' },
  { name: 'Virtual Agent', color: '#eab308' },
];
