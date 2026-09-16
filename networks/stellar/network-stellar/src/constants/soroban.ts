/**
 * A curated SEP-41 token, listed until the hosted definitions carry contract tokens. The metadata
 * only stands in when the contract does not report its own.
 */
export interface StellarContractToken {
    contract: string;
    name?: string;
    symbol?: string;
    decimals?: number;
}

/** There is no on-chain registry of contract-token holdings, so discovery is explicit. */
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
    {
        contract: 'CD2KTWZ3S7BDDNPHJMUYYUDY5B7J4JL4GXVITLMUEPSE5BNTESUOM4LQ',
    },
];
