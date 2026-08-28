import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { ResultadoView } from '../simulados/ResultadoView';

/** Same review screen as ResultadoPraticaPage, reading from praticasPrepper/questoesPrepper. */
export function ResultadoPraticaPrepperPage() {
  const { praticaId } = useParams();
  const id = Number(praticaId);
  const navigate = useNavigate();

  const pratica = useLiveQuery(() => db.praticasPrepper.get(id), [id]);

  if (!pratica) {
    return <div className="simulados-page" />;
  }

  return (
    <ResultadoView
      title={`${pratica.tema} · prática`}
      acertos={pratica.acertos}
      total={pratica.total}
      duracaoSegundos={pratica.duracaoSegundos}
      erros={pratica.erros}
      onBack={() => navigate('/exame-prepper/questoes')}
      fetchQuestoes={(ids) => db.questoesPrepper.bulkGet(ids)}
    />
  );
}
