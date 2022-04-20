// Merge only objects, not arrays
type Mergable = {
    [key: string]: any;
    [index: number]: never;
};

type Merge<A, B> = A extends Mergable ? (B extends Mergable ? MergeResult<A, B> : B) : B;

type MergeResult<A, B> = { [K in Exclude<keyof A, keyof B>]: A[K] } & {
    [K in Exclude<keyof B, keyof A>]: B[K];
} & { [K in keyof A & keyof B]: Merge<A[K], B[K]> };

const isMergable = (value: any): value is Mergable =>
    value && typeof value === 'object' && !Array.isArray(value);

export const mergeObject = <A extends Mergable, B extends Mergable>(
    a: A,
    b: B,
): MergeResult<A, B> =>
    Object.entries(b).reduce((current, [key, newValue]) => {
        const currentValue = current[key];
        return {
            ...current,
            [key]:
                isMergable(currentValue) && isMergable(newValue)
                    ? mergeObject(currentValue, newValue)
                    : newValue,
        };
    }, a) as any;
