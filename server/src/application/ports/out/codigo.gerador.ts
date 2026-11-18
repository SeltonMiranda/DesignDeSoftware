/** Geração do código de rastreamento (RN05), isolada para tornar os testes determinísticos. */
export interface ICodigoGerador {
    gerar(): string;
}
