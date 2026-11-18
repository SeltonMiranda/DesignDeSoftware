import type { Request, Response } from 'express';
import type { Local } from '#domain/local.js';
import { DadosInvalidosError } from '#domain/erros.js';
import type { SolicitarEntregaUseCase } from '#application/ports/in/solicitar.entrega.use-case.js';
import type { ConsultarEncomendaUseCase } from '#application/ports/in/consultar.encomenda.use-case.js';

export class PackageController {
    constructor(
        private readonly solicitarUseCase: SolicitarEntregaUseCase,
        private readonly consultarUseCase: ConsultarEncomendaUseCase,
    ) {}

    solicitar = async (req: Request, res: Response): Promise<void> => {
        try {
            const resultado = await this.solicitarUseCase.execute(req.body);
            res.status(201).json(resultado);
        } catch (erro: unknown) {
            if (erro instanceof DadosInvalidosError) {
                res.status(400).json({ erro: erro.message });
                return;
            }
            console.error('Erro ao cadastrar encomenda:', erro);
            res.status(500).json({ erro: 'Não foi possível cadastrar a encomenda.' });
        }
    };

    consultar = async (req: Request, res: Response): Promise<void> => {
        try {
            const encomenda = await this.consultarUseCase.execute(String(req.params.codigo ?? ''));
            if (!encomenda) {
                res.status(404).json({ erro: 'Encomenda não encontrada.' });
                return;
            }
            res.json({
                codigoRastreio: encomenda.id,
                nomeRemetente: encomenda.nomeRemetente,
                localRemetente: apresentarLocal(encomenda.localRemetente),
                nomeDestinatario: encomenda.nomeDestinatario,
                localDestinatario: apresentarLocal(encomenda.localDestinatario),
                emailDestinatario: encomenda.emailDestinatario,
                descricao: encomenda.volume.descricao,
                conteudo: encomenda.volume.tipo,
                pesoKg: encomenda.volume.pesoKg,
                prioridade: encomenda.prioridade,
                situacao: encomenda.situacao,
                criadoEm: encomenda.createdAt,
                atualizadoEm: encomenda.updatedAt,
                historicoMovimentacao: encomenda.historicoMovimentacao,
            });
        } catch (erro) {
            console.error('Erro ao consultar encomenda:', erro);
            res.status(500).json({ erro: 'Não foi possível consultar a encomenda.' });
        }
    };
}

function apresentarLocal(l: Local) {
    return { id: l.id, campus: l.campus, predio: l.predio, sala: l.sala };
}
