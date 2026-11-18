import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { Prioridade, Situacao, Conteudo } from '#domain/package.js';
import { LocalSchema } from '#infra/database/local.entity.js';

/** Uma linha por encomenda, incluindo o evento inicial de movimentação (JSONB). */
@Entity({ name: 'encomendas' })
export class PackageSchema {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    id!: string;

    @Column({ type: 'varchar', length: 120 })
    nomeRemetente!: string;

    @ManyToOne(() => LocalSchema, { eager: true, nullable: false })
    @JoinColumn({ name: 'localRemetenteId' })
    localRemetente!: LocalSchema;

    @Column({ type: 'varchar', length: 120 })
    nomeDestinatario!: string;

    @ManyToOne(() => LocalSchema, { eager: true, nullable: false })
    @JoinColumn({ name: 'localDestinatarioId' })
    localDestinatario!: LocalSchema;

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
