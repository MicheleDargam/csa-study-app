import { Bell } from 'lucide-react';

interface NotificationPermissionPromptProps {
  onAllow: () => void;
  onDismiss: () => void;
}

/**
 * Pre-permission explainer shown before the browser's own native prompt —
 * asking cold for notification permission gets reflexively denied, so this
 * explains why first.
 */
export function NotificationPermissionPrompt({ onAllow, onDismiss }: NotificationPermissionPromptProps) {
  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Ativar notificações</h2>
        </div>

        <div className="permission-prompt-body">
          <div className="permission-prompt-icon">
            <Bell size={24} />
          </div>
          <p className="confirm-message">
            Para avisar na hora certa de estudar (ou quando sobrarem tarefas pendentes no fim do
            dia), o app precisa da sua permissão para mostrar notificações. Isso só funciona
            enquanto alguma aba do app estiver aberta — nada é enviado para fora do seu navegador.
          </p>
        </div>

        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onDismiss}>
            Agora não
          </button>
          <button className="btn-primary" onClick={onAllow}>
            Permitir notificações
          </button>
        </div>
      </div>
    </div>
  );
}
