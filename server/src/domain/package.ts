export class Package {

    constructor(
        public readonly id: string,
        public readonly owner: string,
        public readonly createdAt: Date = new Date()
    ) {}

}