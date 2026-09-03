import { BigNumber } from '@trezor/utils';

export {
    isSupportedStellarNetwork,
    supportedStellarNetworks,
    toStellarNetworkSymbol,
} from './networkSymbol';
export type { StellarNetworkSymbol } from './networkSymbol';
export * from './rpc';
export { STELLAR_SOROBAN_RPC_URL, STELLAR_CONTRACT_TOKENS } from './soroban';
export type { StellarContractToken } from './soroban';

export const STELLAR_DECIMALS = 7;

// 0.5 XLM, https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#base-reserves
export const STELLAR_BASE_RESERVE = '5000000';

// https://developers.stellar.org/docs/learn/encyclopedia/transactions-specialized/memos
export const STELLAR_MEMO_TEXT_MAX_BYTES = 28;

// Converts an amount from lumens (decimal) to stroops (integer base unit).
export const toStroops = (value: number | string) =>
    new BigNumber(10).pow(STELLAR_DECIMALS).times(new BigNumber(value));
