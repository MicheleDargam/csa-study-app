import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { QuizRunner, type QuizResult } from './QuizRunner';

export function SimuladoRunnerPage() {
  const { simuladoId } = useParams();
  const id = Number(simuladoId);
  const navigate = useNavigate();

  const simulado = useLiveQuery(() => db.simulados.get(id), [id]);
  const questoes = useLiveQuery(
    () => db.questoes.where('simuladoId').equals(id).sortBy('ordem'),
    [id],
  );

  if (!simulado || !questoes) {
    return <div className="simulados-page" />;
  }

  const handleFinish = async (result: QuizResult) => {
    const tentativaId = await db.tentativas.add({
      simuladoId: id,
      simuladoNome: simulado.nome,
      ...result,
    });
    navigate(`/simulados/resultado/${tentativaId}`, { replace: true });
  };

  return (
    <QuizRunner
      title={simulado.nome}
      questoes={questoes}
      onBack={() => navigate('/simulados')}
      onFinish={handleFinish}
    />
  );
}
