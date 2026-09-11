import type { Horizon } from '@stellar/stellar-sdk';

import { groupEffectsByOperation, readBalanceDeltas } from './balances';

type EffectRecord = Horizon.ServerApi.EffectRecord;

const ACCOUNT = 'GAF6GF7PBMZ7EN6RFTTIWO5NVGEP75EW4UI3W5I6ZTMAM45CV6E6G6X4';
const ROUTER = 'CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK';
const POOL = 'CCJHUCHZ2DC6MP7LMGQJYSENNTGIFWU4J4TCGFYYDLAC5LTD4YMF6HSQ';
const ACT_ISSUER = 'GAHHULDPDVGB5WS5PH7BCGLJ7ZHECDBIIMKB62UPVDUOCHNFL7HX3FS7';
const USDC_ISSUER = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
const USDT0_ISSUER = 'GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q';

// The effects resource carries `_links` and a `type_i` that nothing here reads, so each record is
// built from the fields the code under test uses.
const effect = (operationId: string, index: number, fields: Record<string, unknown>) =>
    ({
        paging_token: `${operationId}-${index}`,
        account: ACCOUNT,
        ...fields,
    }) as EffectRecord;

const native = { asset_type: 'native' };
const act = { asset_type: 'credit_alphanum4', asset_code: 'ACT', asset_issuer: ACT_ISSUER };
const usdc = { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: USDC_ISSUER };
const usdt0 = { asset_type: 'credit_alphanum12', asset_code: 'USDT0', asset_issuer: USDT0_ISSUER };

describe('readBalanceDeltas', () => {
    it('returns nothing for an operation that moved no balance', () => {
        expect(readBalanceDeltas([])).toEqual([]);
        expect(
            readBalanceDeltas([effect('1', 1, { type: 'trustline_created', ...act, limit: '1' })]),
        ).toEqual([]);
    });

    // The Soroswap path payment from the account's own history: 1 XLM out, 257.5853446 ACT in.
    it('reads a swap as one debit and one credit of the account', () => {
        const deltas = readBalanceDeltas([
            effect('276361139540262913', 1, {
                type: 'account_credited',
                ...act,
                amount: '257.5853446',
            }),
            effect('276361139540262913', 2, {
                type: 'account_debited',
                ...native,
                amount: '1.0000000',
            }),
            effect('276361139540262913', 3, {
                type: 'liquidity_pool_trade',
                sold: { asset: `ACT:${ACT_ISSUER}`, amount: '257.5853446' },
                bought: { asset: 'native', amount: '1.0000000' },
            }),
        ]);

        expect(deltas).toEqual([
            {
                holder: ACCOUNT,
                asset: { assetCode: 'ACT', assetIssuer: ACT_ISSUER },
                amount: '2575853446',
            },
            { holder: ACCOUNT, asset: undefined, amount: '-10000000' },
        ]);
    });

    // Every leg of this swap is stamped with the account, but six of the eight belong to the
    // router's and the pool's balances — counted as the account's they cancel the swap out.
    it('attributes a contract leg to the contract that holds it, not to the stamped account', () => {
        const deltas = readBalanceDeltas([
            effect('275969335445573633', 1, {
                type: 'account_debited',
                ...usdc,
                amount: '2.0000000',
            }),
            effect('275969335445573633', 2, {
                type: 'contract_credited',
                ...usdc,
                contract: ROUTER,
                amount: '2.0000000',
            }),
            effect('275969335445573633', 3, {
                type: 'contract_debited',
                ...usdc,
                contract: ROUTER,
                amount: '2.0000000',
            }),
            effect('275969335445573633', 4, {
                type: 'contract_credited',
                ...usdc,
                contract: POOL,
                amount: '2.0000000',
            }),
            effect('275969335445573633', 5, {
                type: 'contract_debited',
                ...usdt0,
                contract: POOL,
                amount: '1.9976812',
            }),
            effect('275969335445573633', 6, {
                type: 'contract_credited',
                ...usdt0,
                contract: ROUTER,
                amount: '1.9976812',
            }),
            effect('275969335445573633', 7, {
                type: 'contract_debited',
                ...usdt0,
                contract: ROUTER,
                amount: '1.9976812',
            }),
            effect('275969335445573633', 8, {
                type: 'account_credited',
                ...usdt0,
                amount: '1.9976812',
            }),
        ]);

        expect(deltas.filter(({ holder }) => holder === ACCOUNT)).toEqual([
            {
                holder: ACCOUNT,
                asset: { assetCode: 'USDC', assetIssuer: USDC_ISSUER },
                amount: '-20000000',
            },
            {
                holder: ACCOUNT,
                asset: { assetCode: 'USDT0', assetIssuer: USDT0_ISSUER },
                amount: '19976812',
            },
        ]);
    });

    it('nets several movements of the same asset', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, { type: 'account_credited', ...native, amount: '3.0000000' }),
            effect('1', 2, { type: 'account_debited', ...native, amount: '1.0000000' }),
        ]);

        expect(deltas).toEqual([{ holder: ACCOUNT, asset: undefined, amount: '20000000' }]);
    });

    it('drops an asset whose movements cancel out', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, { type: 'account_credited', ...native, amount: '1.0000000' }),
            effect('1', 2, { type: 'account_debited', ...native, amount: '1.0000000' }),
        ]);

        expect(deltas).toEqual([]);
    });

    it('reads a crossing offer from its trade effect, which is all Horizon reports', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, {
                type: 'trade',
                seller: ROUTER,
                offer_id: '1',
                sold_asset_type: 'native',
                sold_amount: '5.0000000',
                bought_asset_type: 'credit_alphanum4',
                bought_asset_code: 'ACT',
                bought_asset_issuer: ACT_ISSUER,
                bought_amount: '10.0000000',
            }),
        ]);

        expect(deltas).toEqual([
            { holder: ACCOUNT, asset: undefined, amount: '-50000000' },
            {
                holder: ACCOUNT,
                asset: { assetCode: 'ACT', assetIssuer: ACT_ISSUER },
                amount: '100000000',
            },
        ]);
    });

    it('ignores a trade effect of an operation that already reported a credit, so a hop is not counted twice', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, { type: 'account_credited', ...act, amount: '10.0000000' }),
            effect('1', 2, { type: 'account_debited', ...native, amount: '5.0000000' }),
            effect('1', 3, {
                type: 'trade',
                seller: ROUTER,
                offer_id: '1',
                sold_asset_type: 'native',
                sold_amount: '5.0000000',
                bought_asset_type: 'credit_alphanum4',
                bought_asset_code: 'ACT',
                bought_asset_issuer: ACT_ISSUER,
                bought_amount: '10.0000000',
            }),
        ]);

        expect(deltas).toEqual([
            {
                holder: ACCOUNT,
                asset: { assetCode: 'ACT', assetIssuer: ACT_ISSUER },
                amount: '100000000',
            },
            { holder: ACCOUNT, asset: undefined, amount: '-50000000' },
        ]);
    });

    it('weighs trades per operation, so one operation reporting a credit does not silence another', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, { type: 'account_credited', ...native, amount: '1.0000000' }),
            effect('2', 1, {
                type: 'trade',
                seller: ROUTER,
                offer_id: '1',
                sold_asset_type: 'native',
                sold_amount: '2.0000000',
                bought_asset_type: 'credit_alphanum4',
                bought_asset_code: 'ACT',
                bought_asset_issuer: ACT_ISSUER,
                bought_amount: '4.0000000',
            }),
        ]);

        expect(deltas).toEqual([
            { holder: ACCOUNT, asset: undefined, amount: '-10000000' },
            {
                holder: ACCOUNT,
                asset: { assetCode: 'ACT', assetIssuer: ACT_ISSUER },
                amount: '40000000',
            },
        ]);
    });

    it('reads the starting balance of a created account, which is never credited', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, { type: 'account_created', starting_balance: '2.5000000' }),
        ]);

        expect(deltas).toEqual([{ holder: ACCOUNT, asset: undefined, amount: '25000000' }]);
    });

    it('does not read a claimable balance offered to the account as a movement', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, {
                type: 'claimable_balance_claimant_created',
                asset: `AMERICA:${ACT_ISSUER}`,
                balance_id: '00',
                amount: '0.4347826',
            }),
        ]);

        expect(deltas).toEqual([]);
    });

    it('skips a liquidity-pool-share balance, which arrives with no asset code', () => {
        const deltas = readBalanceDeltas([
            effect('1', 1, {
                type: 'account_debited',
                asset_type: 'liquidity_pool_shares',
                amount: '1.0000000',
            }),
        ]);

        expect(deltas).toEqual([]);
    });
});

describe('groupEffectsByOperation', () => {
    it('groups effects by the operation id in their paging token', () => {
        const grouped = groupEffectsByOperation([
            effect('10', 1, { type: 'account_credited', ...native, amount: '1.0000000' }),
            effect('20', 1, { type: 'account_credited', ...native, amount: '2.0000000' }),
            effect('10', 2, { type: 'account_debited', ...native, amount: '3.0000000' }),
        ]);

        expect([...grouped.keys()]).toEqual(['10', '20']);
        expect(grouped.get('10')).toHaveLength(2);
        expect(grouped.get('20')).toHaveLength(1);
    });
});
