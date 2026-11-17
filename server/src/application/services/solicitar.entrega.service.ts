import { randomUUID } from 'node:crypto';
import { Package } from '#domain/package.js';
import type { DadosEncomenda } from '#domain/package.js';
import type { ResultadoCadastro, SolicitarEntregaUseCase } from '#application/ports/in/solicitar.entrega.use-case.js';
import type { IPackageRepository } from '#application/ports/out/package.repository.js';
import type { INotificador } from '#application/ports/out/notificador.js';

export class SolicitarEntregaService implements SolicitarEntregaUseCase {
    constructor(
        private readonly encomendaRepository: IPackageRepository,
        private readonly notificador: INotificador,
        private readonly gerarCodigo: () => string = () => `POL-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`,
        private readonly agora: () => Date = () => new Date(),
    ) {}

    async execute(dados: DadosEncomenda): Promise<ResultadoCadastro> {
        const encomenda = Package.cadastrar(dados, this.gerarCodigo(), this.agora());
        await this.encomendaRepository.save(encomenda);

        // A notificação só é disparada depois da gravação; a falha não desfaz o cadastro.
        // Não aguardar a dependência externa impede atrasos na resposta HTTP.
        queueMicrotask(() => {
            try {
                void Promise.resolve(this.notificador.notificar({
                    destino: encomenda.emailDestinatario,
                    codigoRastreio: encomenda.id,
                    situacao: encomenda.situacao,
                })).catch((erro: unknown) => {
                    console.error('Falha ao enviar notificação de cadastro:', erro);
                });
            } catch (erro) {
                console.error('Falha ao iniciar notificação de cadastro:', erro);
            }
        });

        return {
            codigoRastreio: encomenda.id,
            situacao: encomenda.situacao,
            criadoEm: new Date(encomenda.createdAt),
        };
    }
}
