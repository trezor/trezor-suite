import { type CryptoId } from 'invity-api';

import {
    type AccountSummary,
    type NetworkTxSimulationResult,
    getAssetDiffTransferAmount,
    getEvmSimulationSummary,
    isTxSimulationResultWithMethods,
} from '@suite-common/tx-simulation';
import { BigNumber } from '@trezor/utils';

import { parseCryptoId } from '../../utils';

type EvmAssetDiff = AccountSummary['assets_diffs'][number];
type ReceiveAssetDiff = Extract<EvmAssetDiff, { asset_type: 'ERC20' | 'NATIVE' }>;

const isReceiveAssetDiff = (
    assetDiff: EvmAssetDiff,
    contractAddress: string | undefined,
): assetDiff is ReceiveAssetDiff => {
    if (contractAddress) {
        // `assetDiff.asset` comes verbatim from an unsigned CDN (the cdn.trezor.io/dynamic/blockaid
        // proxy is NOT JWS-verified, so it is attacker/MITM-controllable) and the `@blockaid/client`
        // SDK does not runtime-validate the response shape. `asset` may therefore be missing or a
        // non-object, and the `in` operator throws on a non-object — guard the shape first.
        const { asset }: { asset: unknown } = assetDiff;

        return (
            assetDiff.asset_type === 'ERC20' &&
            typeof asset === 'object' &&
            asset !== null &&
            'address' in asset &&
            typeof asset.address === 'string' &&
            asset.address.toLowerCase() === contractAddress.toLowerCase()
        );
    }

    return assetDiff.asset_type === 'NATIVE';
};

/**
 * Extract how much of the quote's receive asset the user gets according to
 * a successful Blockaid simulation. Returns a decimal string in main units,
 * or `null` when the amount cannot be determined — callers are expected to
 * fall back to the quote data.
 */
export const getSimulatedReceiveAmount = (
    result: NetworkTxSimulationResult | undefined,
    quoteReceiveCryptoId: CryptoId | undefined,
): string | null => {
    // Stellar also has a top-level `simulation`, with a differently shaped account summary, so the
    // narrowing has to be by method. DEX quotes are EVM-only, so nothing else reaches this.
    const summary = isTxSimulationResultWithMethods(
        ['ethereumSignTransaction', 'ethereumSignTypedData'],
        result,
    )
        ? getEvmSimulationSummary(result.payload)
        : null;

    if (!quoteReceiveCryptoId || !summary) {
        return null;
    }

    const { contractAddress } = parseCryptoId(quoteReceiveCryptoId);
    // `summary.assetsDiffs`, and each diff's `in`/`asset`/transfer entries, come verbatim from an
    // unsigned CDN (the cdn.trezor.io/dynamic/blockaid proxy is NOT JWS-verified) and the
    // `@blockaid/client` SDK does not runtime-validate the response, so a malicious/MITM body could
    // ship a non-array or a diff missing `in`/`asset`. This util runs in a render body
    // (`useExchangeIssue`, native `ExchangeToAccountTradePreviewCard`), so an unguarded
    // `.find`/`.length`/`in`-operator deref would throw and crash the exchange preview (no
    // ErrorBoundary). Degrade to `null` at this boundary — callers fall back to the quote data.
    const assetsDiffs: unknown = summary.assetsDiffs;
    if (!Array.isArray(assetsDiffs)) {
        return null;
    }

    const assetDiff = assetsDiffs.find((diff): diff is ReceiveAssetDiff =>
        isReceiveAssetDiff(diff, contractAddress),
    );

    const incoming: unknown = assetDiff?.in;
    if (!Array.isArray(incoming) || incoming.length === 0) {
        return null;
    }

    const asset: unknown = assetDiff?.asset;
    const decimals =
        typeof asset === 'object' &&
        asset !== null &&
        'decimals' in asset &&
        typeof asset.decimals === 'number'
            ? asset.decimals
            : undefined;
    let total = new BigNumber(0);

    for (const transfer of incoming) {
        // A poison transfer entry (null/primitive) would throw on the `.raw_value` deref inside
        // `getAssetDiffTransferAmount`; treat it as unvaluable and fall back to the quote data.
        if (typeof transfer !== 'object' || transfer === null) {
            return null;
        }

        const amount = getAssetDiffTransferAmount(transfer, decimals);

        // Do not display a partial amount when any incoming transfer cannot be valued.
        if (amount === null || amount.isNaN()) {
            return null;
        }

        total = total.plus(amount);
    }

    return total.isGreaterThan(0) ? total.toString() : null;
};
