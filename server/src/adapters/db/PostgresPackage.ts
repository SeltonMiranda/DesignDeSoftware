import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class PostgresPackage {
    @PrimaryColumn()
    id!: string;

    @Column({ type: "varchar", length: 120 })
    owner!: string;

    @Column({ type: "timestamptz" })
    createdAt!: Date;
}