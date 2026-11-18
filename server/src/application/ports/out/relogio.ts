/** Fonte de data e hora (RN12), substituível em testes. */
export interface IRelogio {
    agora(): Date;
}
