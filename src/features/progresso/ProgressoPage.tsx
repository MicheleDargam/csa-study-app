import { useLiveQuery } from 'dexie-react-hooks';
import { getVisaoGeral } from './progressoData';
import { StatTiles } from './StatTiles';
import { HorasPorMateriaChart } from './HorasPorMateriaChart';
import { SimuladoEvolucaoChart } from './SimuladoEvolucaoChart';
import { TemaDesempenhoChart } from './TemaDesempenhoChart';

export function ProgressoPage() {
  const visaoGeral = useLiveQuery(() => getVisaoGeral(), []);

  return (
    <div className="progresso-page">
      <div className="timer-page-header">
        <div>
          <h1 className="timer-page-title">Progresso</h1>
          <p className="timer-page-subtitle">Sua evolução nos estudos para a CSA</p>
        </div>
      </div>

      {visaoGeral && <StatTiles data={visaoGeral} />}

      <HorasPorMateriaChart />
      <SimuladoEvolucaoChart />
      <TemaDesempenhoChart />
    </div>
  );
}
