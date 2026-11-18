import { DadosInvalidosError, LocalNaoEncontradoError } from '#domain/erros.js';
import { Package } from '#domain/package.js';
import type { Local } from '#domain/local.js';
import type {
    ResultadoCadastro,
    SolicitarEntregaComando,
    SolicitarEntregaUseCase,
} from '#application/ports/in/solicitar.entrega.use-case.js';
import type { IPackageRepository } from '#application/ports/out/package.repository.js';
import type { ILocalRepository } from '#application/ports/out/local.repository.js';
import type { INotificador } from '#application/ports/out/notificador.js';
import type { ICodigoGerador } from '#application/ports/out/codigo.gerador.js';
import type { IRelogio } from '#application/ports/out/relogio.js';
import type { ILogger } from '#application/ports/out/logger.js';

/** Cadastro de encomenda (RF01). Depende apenas do domínio e de portas de saída. */
export class SolicitarEntregaService implements SolicitarEntregaUseCase {
    constructor(
        private readonly packageRepository: IPackageRepository,
        private readonly localRepository: ILocalRepository,
        private readonly notificador: INotificador,
        private readonly codigoGerador: ICodigoGerador,
        private readonly relogio: IRelogio,
        private readonly logger: ILogger,
    ) {}

    async execute(comando: SolicitarEntregaComando): Promise<ResultadoCadastro> {
        if (comando === null || typeof comando !== 'object') {
            throw new DadosInvalidosError('Dados do cadastro são obrigatórios.');
        }
        const localRemetente = await this.buscarLocal(comando.localRemetenteId, 'remetente');
        const localDestinatario = await this.buscarLocal(comando.localDestinatarioId, 'destinatário');

        const encomenda = Package.cadastrar({
            nomeRemetente: comando.nomeRemetente,
            localRemetente,
            nomeDestinatario: comando.nomeDestinatario,
            localDestinatario,
            emailDestinatario: comando.emailDestinatario,
            pesoKg: comando.pesoKg,
            conteudo: comando.conteudo,
            prioridade: comando.prioridade,
            ...(comando.descricao !== undefined ? { descricao: comando.descricao } : {}),
        }, this.codigoGerador.gerar(), this.relogio.agora());

        await this.packageRepository.save(encomenda);

        queueMicrotask(() => {
            try {
                void Promise.resolve(this.notificador.notificar({
                    destino: encomenda.emailDestinatario,
                    codigoRastreio: encomenda.id,
                    situacao: encomenda.situacao,
                })).catch((erro: unknown) => {
                    this.logger.erro('Falha ao enviar notificação de cadastro.', erro);
                });
            } catch (erro) {
                this.logger.erro('Falha ao iniciar notificação de cadastro.', erro);
            }
        });

        return {
            codigoRastreio: encomenda.id,
            situacao: encomenda.situacao,
            criadoEm: new Date(encomenda.createdAt),
        };
    }

    private async buscarLocal(id: unknown, papel: string): Promise<Local> {
        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new DadosInvalidosError(`Local do ${papel} deve ser informado pelo id (inteiro positivo).`);
        }
        const local = await this.localRepository.findById(id);
        if (!local) {
            throw new LocalNaoEncontradoError(`Local do ${papel} não encontrado (id ${id}).`);
        }
        return local;
    }
}
