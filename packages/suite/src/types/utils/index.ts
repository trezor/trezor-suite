// make key required
export type RequiredKey<M, K extends keyof M> = Omit<M, K> & Required<Pick<M, K>>;

// object values types
export type ObjectValues<T extends object> = T[keyof T];

// array element type
export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType[number];

// const with optional types
export type ConstWithOptionalFields<Const extends { [key: string]: any }, Fields extends any> = {
    [Key in keyof Const]: {
        [FieldKey in Fields]: Const[Key][FieldKey] extends string | number | object | boolean
            ? Const[Key][FieldKey]
            : undefined;
    };
};

// Extract item from union
export type ItemExtractor<M> = Extract<M, { type: M }>;

// Unwrap type from Promise
export type Await<T> = T extends {
    then(onfulfilled?: (value: infer U) => unknown): unknown;
}
    ? U
    : T;

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer U>
        ? ReadonlyArray<DeepPartial<U>>
        : DeepPartial<T[P]>;
};
