import type { ILogger } from '#application/ports/out/logger.js';

export class ConsoleLogger implements ILogger {
    erro(mensagem: string, causa?: unknown): void {
        console.error(mensagem, causa ?? '');
    }
}
