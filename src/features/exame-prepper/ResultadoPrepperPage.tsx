import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { ResultadoView } from '../simulados/ResultadoView';
import { DomainBreakdownCard } from './DomainBreakdownCard';
import { domainStatsForAttempt } from './domainStats';

/** Same review screen as ResultadoPage, reading from tentativasPrepper/questoesPrepper. */
export function ResultadoPrepperPage() {
  const { tentativaId } = useParams();
  const id = Number(tentativaId);
  const navigate = useNavigate();

  const tentativa = useLiveQuery(() => db.tentativasPrepper.get(id), [id]);
  const domainStats = useLiveQuery(
    () => (tentativa ? domainStatsForAttempt(tentativa.simuladoId, tentativa.erros) : undefined),
    [tentativa],
  );

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
      onBack={() => navigate('/exame-prepper')}
      fetchQuestoes={(ids) => db.questoesPrepper.bulkGet(ids)}
      extra={
        domainStats && (
          <DomainBreakdownCard
            title="Desempenho por domínio"
            stats={domainStats}
            emptyMessage="Nenhuma questão neste simulado tem domínio definido."
          />
        )
      }
    />
  );
}
