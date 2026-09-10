/**
 * Soroban (contract / type-C token) configuration.
 *
 * The Trezor-hosted Stellar proxy serves `stellar-rpc` JSON-RPC on `POST /` from the same
 * origin that serves Horizon's REST endpoints, so contract reads stay inside Trezor's trust
 * boundary. It is kept as its own constant rather than derived from the account's backend URL
 * because a custom Horizon backend is not required to proxy JSON-RPC too.
 *
 * The token allow-list below is still local; it moves to the hosted definitions pipeline once
 * that carries contract tokens.
 */
export const STELLAR_SOROBAN_RPC_URL = 'https://xlm.trezor.io';

export interface StellarContractToken {
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
}

/**
 * Curated allow-list of Soroban contract (SEP-41 / type-C) tokens to look up.
 *
 * There is no on-chain registry of an account's contract-token holdings, so
 * discovery is an explicit allow-list rather than auto-discovery. Every entry
 * has been verified as a native contract token (its address is NOT the Stellar
 * Asset Contract of any classic asset).
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
