import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { QuizRunner, type QuizResult } from '../simulados/QuizRunner';

/** Same flow as SimuladoRunnerPage, backed by the Prepper tables instead. */
export function SimuladoPrepperRunnerPage() {
  const { simuladoId } = useParams();
  const id = Number(simuladoId);
  const navigate = useNavigate();

  const simulado = useLiveQuery(() => db.simuladosPrepper.get(id), [id]);
  const questoes = useLiveQuery(
    () => db.questoesPrepper.where('simuladoId').equals(id).sortBy('ordem'),
    [id],
  );

  if (!simulado || !questoes) {
    return <div className="simulados-page" />;
  }

  const handleFinish = async (result: QuizResult) => {
    const tentativaId = await db.tentativasPrepper.add({
      simuladoId: id,
      simuladoNome: simulado.nome,
      ...result,
    });
    navigate(`/exame-prepper/resultado/${tentativaId}`, { replace: true });
  };

  return (
    <QuizRunner
      title={simulado.nome}
      questoes={questoes}
      draftKey={`simulado-prepper-${id}`}
      onBack={() => navigate('/exame-prepper')}
      onFinish={handleFinish}
    />
  );
}
