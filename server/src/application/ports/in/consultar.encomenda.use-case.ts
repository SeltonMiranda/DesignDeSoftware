import type { Package } from '#domain/package.js';

export interface ConsultarEncomendaUseCase {
    /** Devolve a encomenda do código de rastreio ou `null` se não existir. */
    execute(codigo: string): Promise<Package | null>;
}
