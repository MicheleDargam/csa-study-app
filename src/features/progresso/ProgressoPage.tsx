import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getVisaoGeral, getSimuladosPrepperComTentativas, getEvolucaoSimuladoPrepper } from './progressoData';
import { domainStatsAcrossAllAttempts } from '../exame-prepper/domainStats';
import { DomainBreakdownCard } from '../exame-prepper/DomainBreakdownCard';
import { StatTiles } from './StatTiles';
import { HorasPorMateriaChart } from './HorasPorMateriaChart';
import { SimuladoEvolucaoChart } from './SimuladoEvolucaoChart';
import { TemaDesempenhoChart } from './TemaDesempenhoChart';
import { TemaDesempenhoMensal } from './TemaDesempenhoMensal';

type Trilha = 'csa' | 'prepper';

export function ProgressoPage() {
  const visaoGeral = useLiveQuery(() => getVisaoGeral(), []);
  const [trilha, setTrilha] = useState<Trilha>('csa');
  const domainStats = useLiveQuery(() => domainStatsAcrossAllAttempts(), []);

  return (
    <div className="progresso-page">
      <div className="timer-page-header">
        <div>
          <h1 className="timer-page-title">Progresso</h1>
          <p className="timer-page-subtitle">Sua evolução nos estudos</p>
        </div>
      </div>

      {visaoGeral && <StatTiles data={visaoGeral} />}

      {/* Timer/Tarefas hours aren't tied to a trilha, so this stays above the toggle. */}
      <HorasPorMateriaChart />

      <div className="segmented-control">
        <button
          className={`segmented-btn ${trilha === 'csa' ? 'segmented-btn--active' : ''}`}
          onClick={() => setTrilha('csa')}
        >
          CSA
        </button>
        <button
          className={`segmented-btn ${trilha === 'prepper' ? 'segmented-btn--active' : ''}`}
          onClick={() => setTrilha('prepper')}
        >
          Prepper
        </button>
      </div>

      {trilha === 'csa' ? (
        <>
          <SimuladoEvolucaoChart key="csa" />
          <TemaDesempenhoChart />
          <TemaDesempenhoMensal />
        </>
      ) : (
        <>
          <SimuladoEvolucaoChart
            key="prepper"
            title="Desempenho nos Simulados Prepper"
            emptyMessage="Nenhuma tentativa de Simulado Prepper registrada ainda."
            getResumos={getSimuladosPrepperComTentativas}
            getEvolucao={getEvolucaoSimuladoPrepper}
          />
          <DomainBreakdownCard
            title="Desempenho por domínio"
            subtitle="Acumulado de todas as tentativas de Simulados Prepper"
            stats={domainStats ?? []}
            emptyMessage="Nenhuma questão respondida ainda."
          />
        </>
      )}
    </div>
  );
}
