import type { Horizon } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { toStroops } from '../../constants';

type EffectRecord = Horizon.ServerApi.EffectRecord;

/**
 * A balance that moved, in stroops, negative when it left the holder. `holder` is the real owner
 * of the balance, not the account Horizon stamps on every effect.
 */
export type StellarBalanceDelta = {
    holder: string;
    /** `undefined` for the native asset. */
    asset?: { assetCode: string; assetIssuer: string };
    amount: string;
};

type Asset = Pick<StellarBalanceDelta, 'asset'>;

// Liquidity-pool shares have no asset code, so `undefined` means "not a balance to report".
const readAsset = (
    assetType: string,
    assetCode?: string,
    assetIssuer?: string,
): Asset | undefined => {
    if (assetType === 'native') return { asset: undefined };

    return assetCode && assetIssuer ? { asset: { assetCode, assetIssuer } } : undefined;
};

const signedDelta = (
    holder: string,
    asset: Asset | undefined,
    amount: string,
    direction: 'in' | 'out',
): StellarBalanceDelta[] => {
    if (!asset) return [];

    const stroops = toStroops(amount);

    return [
        { holder, ...asset, amount: (direction === 'in' ? stroops : stroops.negated()).toString() },
    ];
};

/** Credits and debits Horizon states outright. */
const readTransferDeltas = (effect: EffectRecord): StellarBalanceDelta[] => {
    switch (effect.type) {
        case 'account_credited':
            return signedDelta(
                effect.account,
                readAsset(effect.asset_type, effect.asset_code, effect.asset_issuer),
                effect.amount,
                'in',
            );
        case 'account_debited':
            return signedDelta(
                effect.account,
                readAsset(effect.asset_type, effect.asset_code, effect.asset_issuer),
                effect.amount,
                'out',
            );
        // A funded account is credited through `account_created`, never `account_credited`.
        case 'account_created':
            return signedDelta(effect.account, { asset: undefined }, effect.starting_balance, 'in');
        case 'contract_credited':
            return signedDelta(
                effect.contract,
                readAsset(effect.asset_type, effect.asset_code, effect.asset_issuer),
                effect.amount,
                'in',
            );
        case 'contract_debited':
            return signedDelta(
                effect.contract,
                readAsset(effect.asset_type, effect.asset_code, effect.asset_issuer),
                effect.amount,
                'out',
            );
        default:
            return [];
    }
};

/**
 * A crossing offer moves value without a credit or debit, so the trade effect is the only record.
 * `liquidity_pool_trade` is skipped: its sides are the pool's, not the account's.
 */
const readTradeDeltas = (effect: EffectRecord): StellarBalanceDelta[] => {
    if (effect.type !== 'trade') return [];

    return [
        ...signedDelta(
            effect.account,
            readAsset(effect.sold_asset_type, effect.sold_asset_code, effect.sold_asset_issuer),
            effect.sold_amount,
            'out',
        ),
        ...signedDelta(
            effect.account,
            readAsset(
                effect.bought_asset_type,
                effect.bought_asset_code,
                effect.bought_asset_issuer,
            ),
            effect.bought_amount,
            'in',
        ),
    ];
};

const deltaKey = ({ holder, asset }: StellarBalanceDelta) =>
    `${holder}:${asset ? `${asset.assetCode}-${asset.assetIssuer}` : 'native'}`;

/** `paging_token` is `<operation id>-<index>`, the only link from an effect to its operation. */
export const groupEffectsByOperation = (
    effects: readonly EffectRecord[],
): Map<string, EffectRecord[]> => {
    const byOperation = new Map<string, EffectRecord[]>();

    effects.forEach(effect => {
        const [operationId] = effect.paging_token.split('-');
        if (!operationId) return;

        const existing = byOperation.get(operationId);
        if (existing) {
            existing.push(effect);
        } else {
            byOperation.set(operationId, [effect]);
        }
    });

    return byOperation;
};

/**
 * Nets one transaction's effects per holder and asset. A path payment reports its hops as trades on
 * top of its credit and debit, so trades only count for an operation that moved nothing else.
 */
export const readBalanceDeltas = (effects: readonly EffectRecord[]): StellarBalanceDelta[] => {
    const totals = new Map<string, StellarBalanceDelta>();

    groupEffectsByOperation(effects).forEach(operationEffects => {
        const transfers = operationEffects.flatMap(readTransferDeltas);
        const deltas = transfers.length > 0 ? transfers : operationEffects.flatMap(readTradeDeltas);

        deltas.forEach(delta => {
            const key = deltaKey(delta);
            const running = totals.get(key);

            totals.set(
                key,
                running
                    ? {
                          ...running,
                          amount: new BigNumber(running.amount).plus(delta.amount).toString(),
                      }
                    : delta,
            );
        });
    });

    return [...totals.values()].filter(({ amount }) => !new BigNumber(amount).isZero());
};
