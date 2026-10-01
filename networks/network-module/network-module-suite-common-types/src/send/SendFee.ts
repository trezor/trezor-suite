/**
 * How a network prices a transaction. Declared as data: platforms pick formatting and copy from
 * it, the generic form decides from `selectable` whether a fee selector slot exists at all.
 */
export type SendFeeModel = {
    readonly model: 'per-byte' | 'per-transaction' | 'priority';
    /** Display unit of a level's value, e.g. `sat/vB`. */
    readonly unit: string;
    /** Whether the user picks among levels; a network with one fixed fee has no selector. */
    readonly selectable: boolean;
};

/** One fee level as the strategy reports it; copy for the level is a platform concern. */
export type SendFeeLevel = {
    readonly id: string;
    /** Value in the fee model's unit. */
    readonly value: string;
};
