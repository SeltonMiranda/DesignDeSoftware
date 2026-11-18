export interface ILogger {
    erro(mensagem: string, causa?: unknown): void;
}
