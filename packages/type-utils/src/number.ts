type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>;

/**
 * Maximum that can be handled by typescript is <0,999>
 */
export type Range<Min extends number, Max extends number> =
    | Exclude<Enumerate<Min>, Enumerate<Max>>
    | Max;
