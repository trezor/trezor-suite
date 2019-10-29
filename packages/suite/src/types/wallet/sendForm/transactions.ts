export type PrecomposedTransactionXrp =
    | { type: 'error'; error: string }
    | { type: 'nonfinal'; max: string; totalSpent: string; fee: string }
    | { type: 'final'; max: string; totalSpent: string; fee: string };
