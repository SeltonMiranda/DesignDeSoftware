import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

/** Tabela `locais`: cadastro de campus, prédio e sala. Populada por `seed/locais.seed.ts`. */
@Entity({ name: 'locais' })
@Unique(['campus', 'predio', 'sala'])
export class LocalSchema {
    @PrimaryColumn({ type: 'int' })
    id!: number;

    @Column({ type: 'varchar', length: 80 })
    campus!: string;

    @Column({ type: 'varchar', length: 120 })
    predio!: string;

    @Column({ type: 'varchar', length: 80 })
    sala!: string;
}
