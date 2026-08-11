import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { ResultadoView } from './ResultadoView';

export function ResultadoPage() {
  const { tentativaId } = useParams();
  const id = Number(tentativaId);
  const navigate = useNavigate();

  const tentativa = useLiveQuery(() => db.tentativas.get(id), [id]);

  if (!tentativa) {
    return <div className="simulados-page" />;
  }

  return (
    <ResultadoView
      title={tentativa.simuladoNome}
      acertos={tentativa.acertos}
      total={tentativa.total}
      duracaoSegundos={tentativa.duracaoSegundos}
      erros={tentativa.erros}
      onBack={() => navigate('/simulados')}
    />
  );
}
