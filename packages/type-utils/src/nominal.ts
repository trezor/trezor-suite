export class Nominal<T extends string> {
    __type!: T;
}

export class NominalA2<P1 extends string, P2> {
    __type1!: P1;
    __type2!: P2;
}
