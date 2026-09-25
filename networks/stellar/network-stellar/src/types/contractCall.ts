/** Pre-rendered by the decoder; an account and a contract live under different explorer paths. */
export type StellarContractCallArgument = {
    kind: 'account' | 'contract' | 'text';
    value: string;
};

/** One node of the authorization tree, flattened depth-first. */
export type StellarAuthorizedCallData = {
    contractId: string;
    functionName: string;
    depth: number;
    args: StellarContractCallArgument[];
};

/** A Soroban invocation decoded from the envelope; arguments are positional. */
export type StellarContractCallData = {
    contractId: string;
    functionName: string;
    args: StellarContractCallArgument[];
    authorizedCalls: StellarAuthorizedCallData[];
};
