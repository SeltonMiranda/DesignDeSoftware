import type { IRelogio } from '#application/ports/out/relogio.js';

export class RelogioSistema implements IRelogio {
    agora(): Date {
        return new Date();
    }
}
