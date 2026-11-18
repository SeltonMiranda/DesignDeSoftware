import { randomUUID } from 'node:crypto';
import type { ICodigoGerador } from '#application/ports/out/codigo.gerador.js';

/** Gera códigos no formato `POL-XXXXXXXXXXXX`. */
export class UuidCodigoGerador implements ICodigoGerador {
    gerar(): string {
        return `POL-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    }
}
