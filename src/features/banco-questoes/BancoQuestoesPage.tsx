import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowLeft, Database, History } from 'lucide-react';
import { db } from '../../db/database';

interface TemaGroup {
  tema: string;
  materia: string;
  count: number;
}

export function BancoQuestoesPage() {
  const navigate = useNavigate();
  const questoes = useLiveQuery(() => db.questoes.toArray(), []);

  const porTema = useMemo<TemaGroup[]>(() => {
    const map = new Map<string, TemaGroup>();
    for (const q of questoes ?? []) {
      const existing = map.get(q.tema);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(q.tema, { tema: q.tema, materia: q.materia, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.tema.localeCompare(b.tema));
  }, [questoes]);

  const porMateria = useMemo(() => {
    const map = new Map<string, { materia: string; temas: TemaGroup[]; total: number }>();
    for (const item of porTema) {
      const group = map.get(item.materia) ?? { materia: item.materia, temas: [], total: 0 };
      group.temas.push(item);
      group.total += item.count;
      map.set(item.materia, group);
    }
    return Array.from(map.values());
  }, [porTema]);

  const goToTema = (tema: string, materia: string) => {
    navigate(`tema?nome=${encodeURIComponent(tema)}&materia=${encodeURIComponent(materia)}`);
  };

  return (
    <div className="simulados-page">
      <div className="timer-page-header">
        <div className="materias-page-heading">
          <button className="timer-btn-icon" onClick={() => navigate('/simulados')} title="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="timer-page-title">Banco de Questões</h1>
        </div>
        <Link to="historico" className="timer-btn-icon" title="Histórico de prática">
          <History size={20} />
        </Link>
      </div>

      {questoes?.length === 0 ? (
        <div className="history-empty">
          <Database size={32} className="history-empty-icon" />
          <p>Nenhuma questão disponível ainda.</p>
          <p className="history-empty-sub">Importe um simulado para popular o banco de questões.</p>
        </div>
      ) : (
        <div className="materia-group-list">
          <h2 className="task-group-title">Por Matéria</h2>
          {porMateria.map((group) => (
            <div key={group.materia} className="materia-group">
              <div className="materia-group-header">
                <span className="materia-group-name">{group.materia}</span>
                <span className="materia-group-total">{group.total} questões</span>
              </div>
              <div className="materias-list">
                {group.temas.map((item) => (
                  <button key={item.tema} className="tema-row" onClick={() => goToTema(item.tema, group.materia)}>
                    <span className="tema-row-name">{item.tema}</span>
                    <span className="tema-row-count">{item.count} questões</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
