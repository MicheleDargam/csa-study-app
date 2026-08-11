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

// Domínios de conteúdo típicos da certificação CSA — pré-cadastrados no
// primeiro uso, mas totalmente editáveis/removíveis pelo usuário depois.
export const DEFAULT_MATERIAS = [
  { name: 'Now Platform', color: '#6366f1' },
  { name: 'User Interface', color: '#3b82f6' },
  { name: 'System Administration', color: '#ef4444' },
  { name: 'Service Portal', color: '#f97316' },
  { name: 'Flow Designer & Automação', color: '#06b6d4' },
  { name: 'Reporting & Performance Analytics', color: '#22c55e' },
  { name: 'App Engine Studio', color: '#eab308' },
  { name: 'Integrações', color: '#ec4899' },
];
