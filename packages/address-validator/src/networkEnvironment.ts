export type NetworkEnvironment =
    | 'prod'
    | 'testnet'
    | 'regtest'
    // TODO: 'stake' is a Cardano address kind (stake vs payment), not a network
    // environment, and is orthogonal to mainnet/testnet. It is wedged in here
    // because the validator currently dispatches HRP/length rules through this
    // single parameter. Refactor: detect stake addresses inside ada_validator
    // and drop this member.
    | 'stake'
    | 'both';
