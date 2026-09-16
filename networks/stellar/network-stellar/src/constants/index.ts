import { BigNumber } from '@trezor/utils';

export { isSupportedStellarNetwork, supportedStellarNetworks } from './networkSymbol';
export type { StellarNetworkSymbol } from './networkSymbol';
export * from './memo';
export * from './rpc';
export { STELLAR_CONTRACT_TOKENS } from './soroban';
export type { StellarContractToken } from './soroban';
export * from './transactionLabels';

export const STELLAR_DECIMALS = 7;

// 0.5 XLM, https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#base-reserves
export const STELLAR_BASE_RESERVE = '5000000';

/**
 * Coin definitions key classic assets as `CODE-ISSUER` and native SEP-41 tokens by their bare
 * `C…` contract address. Only the former names a trustline, so only the former can be activated.
 */
export const isStellarClassicAssetKey = (contract: string) => contract.includes('-');

// Converts an amount from lumens (decimal) to stroops (integer base unit).
export const toStroops = (value: number | string) =>
    new BigNumber(10).pow(STELLAR_DECIMALS).times(new BigNumber(value));
