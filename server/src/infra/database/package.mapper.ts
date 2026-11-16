import { Package } from '#domain/package.js';
import { PackageSchema } from '#infra/database/package.entity.js';

export class PackageMapper {
    static toDomain(row: PackageSchema): Package {
        return Package.restaurar({
            id: row.id,
            nomeRemetente: row.nomeRemetente,
            localRemetente: row.localRemetente,
            nomeDestinatario: row.nomeDestinatario,
            localDestinatario: row.localDestinatario,
            emailDestinatario: row.emailDestinatario,
            descricao: row.descricao,
            conteudo: row.conteudo,
            pesoKg: row.pesoKg,
            prioridade: row.prioridade,
            situacao: row.situacao,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            movimentacoes: row.movimentacoes.map((mov) => ({
                ...mov,
                ocorridoEm: new Date(mov.ocorridoEm),
            })),
        });
    }

    static toPersistence(encomenda: Package): PackageSchema {
        const row = new PackageSchema();
        row.id = encomenda.id;
        row.nomeRemetente = encomenda.nomeRemetente;
        row.localRemetente = encomenda.localRemetente;
        row.nomeDestinatario = encomenda.nomeDestinatario;
        row.localDestinatario = encomenda.localDestinatario;
        row.emailDestinatario = encomenda.emailDestinatario;
        row.descricao = encomenda.volume.descricao;
        row.conteudo = encomenda.volume.tipo;
        row.pesoKg = encomenda.volume.pesoKg;
        row.prioridade = encomenda.prioridade;
        row.situacao = encomenda.situacao;
        row.createdAt = encomenda.createdAt;
        row.updatedAt = encomenda.updatedAt;
        row.movimentacoes = encomenda.historicoMovimentacao.map((mov) => ({
            situacao: mov.situacao,
            ocorridoEm: mov.ocorridoEm.toISOString(),
            ...(mov.motivoCancelamento ? { motivoCancelamento: mov.motivoCancelamento } : {}),
        }));
        return row;
    }
}
