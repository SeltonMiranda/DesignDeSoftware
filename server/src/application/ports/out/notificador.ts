/** Dependência externa substituível conforme RNF02. */
export interface Notificacao {
    destino: string;
    codigoRastreio: string;
    situacao: string;
}

export interface INotificador {
    notificar(notificacao: Notificacao): Promise<void> | void;
}
