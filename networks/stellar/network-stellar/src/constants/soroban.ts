/**
 * No RPC endpoint lives here: the Stellar backend serves `stellar-rpc` JSON-RPC on `POST /` from
 * the same origin as Horizon's REST paths, so contract reads go to the backend the account is on.
 * The allow-list below is local until the hosted definitions pipeline carries contract tokens.
 */

export interface StellarContractToken {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
}

/**
 * Fallback allow-list, behind the hosted definitions pipeline: there is no on-chain registry of an
 * account's contract-token holdings, so discovery is explicit. Every entry is a native contract
 * token, not the SAC of a classic asset.
 */
export const STELLAR_CONTRACT_TOKENS: StellarContractToken[] = [
    {
        // Centrifuge deRWA — Janus Henderson Short-Term US Treasury (LayerZero OFT)
        contract: 'CBI7UCH5KGSVQRO5H4SUCZUTZABCITZLRHQQZTWL2TK4RZ72TAR6IHRV',
        name: 'deJTRSY',
        symbol: 'deJTRSY',
        decimals: 18,
    },
    {
        // Centrifuge deRWA — AAA CLO strategy (LayerZero OFT)
        contract: 'CC64WBDGS6QQP22QTTIACYIXT3WF7BBQEYOQPLTP7GTKYY7PZ74QYGSL',
        name: 'deJAAA',
        symbol: 'deJAAA',
        decimals: 18,
    },
    {
        // Blend BLND:USDC 80/20 Comet backstop LP token
        contract: 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM',
        name: 'Blend BLND:USDC Backstop LP',
        symbol: 'CPAL',
        decimals: 7,
    },
];
