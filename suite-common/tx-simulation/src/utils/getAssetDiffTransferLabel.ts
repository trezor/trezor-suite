import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asAmountUnit } from '@suite-common/wallet-utils';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import { BigNumber } from '@trezor/utils';

import { getAssetDiffTransferAmount } from './getAssetDiffTransferAmount';
import { getSolanaAssetDiffs, getStellarAssetDiffs } from './getSimulationAssetDiffs';
import {
    type NetworkTxSimulationResult,
    type SolanaAssetDiff,
    type StellarAssetDiff,
} from '../types';

type SolanaTransfer = NonNullable<SolanaAssetDiff['in'] | SolanaAssetDiff['out']>;
type StellarTransfer = NonNullable<StellarAssetDiff['in'] | StellarAssetDiff['out']>;
// `undefined` stands for the network's coin and for an asset without a symbol to show.
type SimulatedToken = { contract: TokenAddress; symbol: string } | undefined;

const getSolanaToken = ({ asset }: SolanaAssetDiff): SimulatedToken =>
    'address' in asset && 'symbol' in asset && asset.symbol
        ? { contract: toTokenAddress(asset.address), symbol: asset.symbol }
        : undefined;

const getStellarToken = ({ asset }: StellarAssetDiff): SimulatedToken => {
    if ('address' in asset && asset.symbol) {
        return { contract: toTokenAddress(asset.address), symbol: asset.symbol };
    }

    // Suite keys a classic asset by its code and issuer.
    return 'issuer' in asset
        ? { contract: toTokenAddress(`${asset.code}-${asset.issuer}`), symbol: asset.code }
        : undefined;
};

const composeValue = (
    transfer: { raw_value: number; value: number },
    decimals: number | undefined,
    token: SimulatedToken,
) => {
    const amount = getAssetDiffTransferAmount(transfer, decimals) ?? new BigNumber(transfer.value);

    return { amount: asAmountUnit(amount), contractAddress: token?.contract };
};

/**
 * Amount of a Solana asset-diff transfer, e.g. `37.191885 fone`.
 *
 * Blockaid's own `summary` is unusable here: unlike EVM ("Sending 0.01 ETH") the Solana endpoint
 * phrases it in USD ("Lost approximately 0.42$"), which repeats the fiat column and hides the
 * amount the user gets.
 */
export const getSolanaAssetDiffValue = (assetDiff: SolanaAssetDiff, transfer: SolanaTransfer) =>
    composeValue(
        transfer,
        'decimals' in assetDiff.asset ? assetDiff.asset.decimals : undefined,
        getSolanaToken(assetDiff),
    );

/**
 * Same for Stellar. Blockaid rounds its main-unit `value` for display — a BTC-sized amount even
 * arrives as `0` — so the amount always comes from the exact `raw_value`, a stroop count like
 * everywhere else in Suite (`getStellarInactiveTokens`).
 */
export const getStellarAssetDiffValue = (assetDiff: StellarAssetDiff, transfer: StellarTransfer) =>
    composeValue(transfer, STELLAR_DECIMALS, getStellarToken(assetDiff));

const getSimulatedTokens = (result: NetworkTxSimulationResult): SimulatedToken[] => {
    switch (result.method) {
        case 'solanaSignTransaction':
            return (getSolanaAssetDiffs(result.payload) ?? []).map(getSolanaToken);
        case 'stellarSignTransaction':
            return (getStellarAssetDiffs(result.payload) ?? []).map(getStellarToken);
        default:
            return [];
    }
};

/** The simulated tokens as token metadata, so that one the account does not hold still resolves. */
export const getTxSimulationTokenSources = (
    result: NetworkTxSimulationResult,
    networkSymbol: NetworkSymbol,
) => [{ networkSymbol, tokens: getSimulatedTokens(result).flatMap(token => token ?? []) }];
