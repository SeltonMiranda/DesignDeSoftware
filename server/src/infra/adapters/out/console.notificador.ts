import type { INotificador, Notificacao } from '#application/ports/out/notificador.js';

/** Adaptador simulado: não envia e-mail de verdade. */
export class ConsoleNotificador implements INotificador {
    notificar(dados: Notificacao): void {
        console.log('[NOTIFICAÇÃO SIMULADA]', JSON.stringify(dados));
    }
}
