export class Branded<T extends string> {
    __type!: T;
}

export class BrandedArity2<P1 extends string, P2> {
    __type1!: P1;
    __type2!: P2;
}
