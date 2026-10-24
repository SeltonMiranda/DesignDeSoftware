import { Column, CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class PackageSchema {
    @PrimaryColumn({ type: "varchar"})
    id!: string;

    @Column({ type: "varchar", length: 120 })
    owner!: string;

    @Column({ type: "timestamptz" })
    createdAt!: Date;
}