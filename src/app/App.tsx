import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { ErrorBoundary } from './ErrorBoundary';
import { TimerPage } from '../features/timer/TimerPage';
import { TimerProvider } from '../features/timer/TimerContext';
import { TarefasPage } from '../features/tarefas/TarefasPage';
import { MateriasPage } from '../features/materias/MateriasPage';
import { LembretesPage } from '../features/lembretes/LembretesPage';
import { useLembreteScheduler } from '../features/lembretes/useLembreteScheduler';
import { SimuladosPage } from '../features/simulados/SimuladosPage';
import { SimuladoRunnerPage } from '../features/simulados/SimuladoRunnerPage';
import { ResultadoPage } from '../features/simulados/ResultadoPage';
import { HistoricoPage } from '../features/simulados/HistoricoPage';
import { BancoQuestoesPage } from '../features/banco-questoes/BancoQuestoesPage';
import { TemaPracticaPage } from '../features/banco-questoes/TemaPracticaPage';
import { ResultadoPraticaPage } from '../features/banco-questoes/ResultadoPraticaPage';
import { HistoricoPraticaPage } from '../features/banco-questoes/HistoricoPraticaPage';
import { ExamePrepperPage } from '../features/exame-prepper/ExamePrepperPage';
import { SimuladoPrepperRunnerPage } from '../features/exame-prepper/SimuladoPrepperRunnerPage';
import { ResultadoPrepperPage } from '../features/exame-prepper/ResultadoPrepperPage';
import { HistoricoPrepperPage } from '../features/exame-prepper/HistoricoPrepperPage';
import { QuestoesPrepperPage } from '../features/exame-prepper/QuestoesPrepperPage';
import { DomainPracticaPrepperPage } from '../features/exame-prepper/DomainPracticaPrepperPage';
import { ResultadoPraticaPrepperPage } from '../features/exame-prepper/ResultadoPraticaPrepperPage';
import { HistoricoPraticaPrepperPage } from '../features/exame-prepper/HistoricoPraticaPrepperPage';
import { SimuladoGeradoPage } from '../features/exame-prepper/SimuladoGeradoPage';
import {
  seedDefaultMaterias,
  seedSimulados,
  seedAvulsas,
  seedSimuladosPrepper,
  seedLembretePadrao,
  migrateMateriasParaTemas,
  migrateDedupCursoSimulados,
  migrateRemoveDuplicateQuestoes,
  migrateRemoveDuplicateQuestoesV2,
} from '../db/seed';

// recharts pulls in a sizeable chunk — only fetch it when Progresso is visited
const ProgressoPage = lazy(() =>
  import('../features/progresso/ProgressoPage').then((m) => ({ default: m.ProgressoPage })),
);

export function App() {
  // Seed default CSA subjects, bundled simulados and loose question
  // batches once, regardless of which route loads first
  useEffect(() => {
    seedDefaultMaterias();
    migrateMateriasParaTemas();
    migrateDedupCursoSimulados();
    migrateRemoveDuplicateQuestoes();
    migrateRemoveDuplicateQuestoesV2();
    seedSimulados();
    seedAvulsas();
    seedSimuladosPrepper();
    seedLembretePadrao();
  }, []);

  // Runs once at the app root so reminders keep checking regardless of route
  useLembreteScheduler();

  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <TimerProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<TimerPage />} />
              <Route path="/tarefas" element={<TarefasPage />} />
              <Route path="/tarefas/materias" element={<MateriasPage />} />
              <Route path="/tarefas/lembretes" element={<LembretesPage />} />
              <Route path="/simulados" element={<SimuladosPage />} />
              <Route path="/simulados/historico" element={<HistoricoPage />} />
              <Route path="/simulados/resultado/:tentativaId" element={<ResultadoPage />} />
              <Route path="/simulados/banco" element={<BancoQuestoesPage />} />
              <Route path="/simulados/banco/tema" element={<TemaPracticaPage />} />
              <Route path="/simulados/banco/historico" element={<HistoricoPraticaPage />} />
              <Route path="/simulados/banco/resultado/:praticaId" element={<ResultadoPraticaPage />} />
              <Route path="/simulados/:simuladoId" element={<SimuladoRunnerPage />} />
              <Route path="/exame-prepper" element={<ExamePrepperPage />} />
              <Route path="/exame-prepper/historico" element={<HistoricoPrepperPage />} />
              <Route path="/exame-prepper/resultado/:tentativaId" element={<ResultadoPrepperPage />} />
              <Route path="/exame-prepper/gerado" element={<SimuladoGeradoPage />} />
              <Route path="/exame-prepper/questoes" element={<QuestoesPrepperPage />} />
              <Route path="/exame-prepper/questoes/dominio" element={<DomainPracticaPrepperPage />} />
              <Route path="/exame-prepper/questoes/historico" element={<HistoricoPraticaPrepperPage />} />
              <Route path="/exame-prepper/questoes/resultado/:praticaId" element={<ResultadoPraticaPrepperPage />} />
              <Route path="/exame-prepper/:simuladoId" element={<SimuladoPrepperRunnerPage />} />
              <Route
                path="/progresso"
                element={
                  <Suspense fallback={<div className="progresso-page" />}>
                    <ProgressoPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </TimerProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
