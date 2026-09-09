import type { Horizon } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils';

import { toStroops } from '../../constants';

type EffectRecord = Horizon.ServerApi.EffectRecord;

/**
 * A balance that moved, in stroops, signed so that a negative amount left the holder.
 *
 * `holder` is the address the balance belongs to, which is not the `account` Horizon stamps on
 * every effect: a `contract_credited` names the classic account that sourced the operation, while
 * the balance itself belongs to the contract in its own `contract` field. A Soroswap swap of 2
 * USDC for USDT0 reports one `account_debited` and one `account_credited` for the account next to
 * six `contract_*` legs for the router's and the pool's balances, every one of them stamped with
 * the account — read as the account's own, those six net the swap to exactly nothing. Keeping the
 * real holder is also what identifies the counterparty.
 */
export type StellarBalanceDelta = {
    holder: string;
    /** `undefined` for the native asset */
    asset?: { assetCode: string; assetIssuer: string };
    amount: string;
};

type Asset = Pick<StellarBalanceDelta, 'asset'>;

// Liquidity-pool shares are a balance Suite has no representation for, and they arrive with no
// asset code — `undefined` means "not a balance to report", as against a native `{ asset: undefined }`.
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

/**
 * The movements Horizon states outright. These are authoritative: whatever else an operation
 * emitted, a credit or a debit is the ledger's own account of what the balance did.
 */
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
 * A crossing offer moves value without Horizon crediting or debiting anything — the trade effect
 * is the only record of it. Its `sold`/`bought` are written from the effect account's side.
 *
 * `liquidity_pool_trade` is deliberately not read: its `sold`/`bought` are the pool's side of the
 * swap, the inverse of the account's, and inverting it here would invent a direction. An operation
 * that only ever produced one of those reports no movement rather than a wrong one.
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

/**
 * An effect's `paging_token` is `<operation id>-<index>`, the only link an effect carries back to
 * the operation that produced it — the effects resource reports no transaction hash.
 */
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
 * Nets the effects of one transaction into a single movement per holder and asset.
 *
 * Trades are weighed per operation rather than per transaction: Horizon reports the hops of a path
 * payment as trades *on top of* the credit and debit the payment itself produced, so counting both
 * would double the swap, while a crossing offer produces nothing but trades. A trade therefore
 * only speaks for an operation that credited and debited nothing.
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

/** The account's own movements, as against the other holders a swap routed through. */
export const selectOwnDeltas = (deltas: readonly StellarBalanceDelta[], descriptor: string) =>
    deltas.filter(({ holder }) => holder === descriptor);

/** Holders on the other side of the movement, nearest counterparty first. */
export const selectCounterparties = (
    deltas: readonly StellarBalanceDelta[],
    descriptor: string,
): string[] =>
    [...new Set(deltas.map(({ holder }) => holder))].filter(holder => holder !== descriptor);
