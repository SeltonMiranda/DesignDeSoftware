import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { LocalCampus, Prioridade, Situacao, Conteudo } from '#domain/package.js';

/** Uma linha por encomenda, incluindo o evento inicial de movimentação (JSONB). */
@Entity({ name: 'encomendas' })
export class PackageSchema {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    id!: string;

    @Column({ type: 'varchar', length: 120 })
    nomeRemetente!: string;

    @Column({ type: 'jsonb' })
    localRemetente!: LocalCampus;

    @Column({ type: 'varchar', length: 120 })
    nomeDestinatario!: string;

    @Column({ type: 'jsonb' })
    localDestinatario!: LocalCampus;

    @Column({ type: 'varchar', length: 255 })
    emailDestinatario!: string;

    @Column({ type: 'varchar', length: 255 })
    descricao!: string;

    @Column({ type: 'varchar', length: 20 })
    conteudo!: Conteudo;

    @Column({ type: 'float' })
    pesoKg!: number;

    @Column({ type: 'varchar', length: 10 })
    prioridade!: Prioridade;

    @Column({ type: 'varchar', length: 30 })
    situacao!: Situacao;

    @Column({ type: 'timestamptz' })
    createdAt!: Date;

    @Column({ type: 'timestamptz' })
    updatedAt!: Date;

    @Column({ type: 'jsonb' })
    movimentacoes!: Array<{ situacao: Situacao; ocorridoEm: string; motivoCancelamento?: string }>;
}
