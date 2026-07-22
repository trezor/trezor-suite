import {
    type Account,
    type CryptoBaseCurrencyPair,
    type RatesByTimestamps,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';

import { walletPersistTransform } from '../transforms/walletTransforms';

// Hour-aligned unix timestamps in seconds (historic rates are keyed by the past hour).
const HOUR_A = 1700002800;
const HOUR_B = HOUR_A + 3600;

const REMEMBERED_STATE = 'SESSION_REMEMBERED';
const NOT_REMEMBERED_STATE = 'SESSION_FORGOTTEN';

const TOKEN_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;

const btcTransaction = (blockTime: number): WalletAccountTransaction =>
    ({ txid: `btc-${blockTime}`, symbol: 'btc', blockTime, tokens: [] }) as WalletAccountTransaction;

const ethTokenTransaction = (blockTime: number): WalletAccountTransaction =>
    ({
        txid: `eth-${blockTime}`,
        symbol: 'eth',
        blockTime,
        tokens: [{ contract: TOKEN_CONTRACT, standard: 'ERC20', amount: '1', decimals: 6 }],
    }) as unknown as WalletAccountTransaction;

const account = (key: string, deviceState: string): Account =>
    ({ key, deviceState }) as unknown as Account;

// Build the `wallet` sub-state the transform receives as its inbound value.
const buildInboundState = ({
    transactions,
    historic,
    accounts = [],
    current = {},
    lastWeek = {},
}: {
    transactions: Record<string, Array<WalletAccountTransaction | null>>;
    historic: RatesByTimestamps;
    accounts?: Account[];
    current?: RatesByTimestamps;
    lastWeek?: RatesByTimestamps;
}) => ({
    accounts,
    transactions: { transactions, phishing: {}, fetchStatusDetail: {} },
    fiat: { current, lastWeek, historic },
});

// Minimal root state read by `selectDeviceStatesNotRemembered` (only `device.devices` matters).
const buildRootState = (
    devices: Array<{ remember: boolean; state: { staticSessionId: string } }>,
) => ({ device: { devices } });

const rememberedRootState = buildRootState([
    { remember: true, state: { staticSessionId: REMEMBERED_STATE } },
]);

const runInbound = (inboundState: ReturnType<typeof buildInboundState>, rootState: unknown) =>
    walletPersistTransform.in(inboundState as any, 'wallet', rootState as any);

describe('walletPersistTransform historic fiat rates', () => {
    it('persists only historic rates referenced by an existing transaction (prunes orphans)', () => {
        const historic = {
            'btc-usd': { [HOUR_A]: 50000, [HOUR_B]: 51000 },
        } as unknown as RatesByTimestamps;

        const result = runInbound(
            buildInboundState({
                transactions: { 'acc-a': [btcTransaction(HOUR_A)] },
                historic,
            }),
            rememberedRootState,
        );

        // HOUR_B has no referencing transaction, so it is dropped.
        expect(result.fiat.historic).toEqual({ 'btc-usd': { [HOUR_A]: 50000 } });
    });

    it('keeps token historic rates for a referenced token transaction', () => {
        const tokenKey = `eth-${TOKEN_CONTRACT}-usd` as CryptoBaseCurrencyPair;
        const historic = {
            'eth-usd': { [HOUR_A]: 3000 },
            [tokenKey]: { [HOUR_A]: 1 },
        } as unknown as RatesByTimestamps;

        const result = runInbound(
            buildInboundState({
                transactions: { 'acc-a': [ethTokenTransaction(HOUR_A)] },
                historic,
            }),
            rememberedRootState,
        );

        expect(result.fiat.historic).toEqual({
            'eth-usd': { [HOUR_A]: 3000 },
            [tokenKey]: { [HOUR_A]: 1 },
        });
    });

    it('drops historic rates referenced only by non-remembered devices', () => {
        const historic = {
            'btc-usd': { [HOUR_A]: 50000, [HOUR_B]: 51000 },
        } as unknown as RatesByTimestamps;

        const rootState = buildRootState([
            { remember: true, state: { staticSessionId: REMEMBERED_STATE } },
            { remember: false, state: { staticSessionId: NOT_REMEMBERED_STATE } },
        ]);

        const result = runInbound(
            buildInboundState({
                transactions: {
                    [`acc-a-${REMEMBERED_STATE}`]: [btcTransaction(HOUR_A)],
                    [`acc-b-${NOT_REMEMBERED_STATE}`]: [btcTransaction(HOUR_B)],
                },
                historic,
            }),
            rootState,
        );

        // Only the remembered device's transaction (HOUR_A) keeps its rate.
        expect(result.fiat.historic).toEqual({ 'btc-usd': { [HOUR_A]: 50000 } });
    });

    it('returns the full fiat shape with empty current/lastWeek', () => {
        const historic = { 'btc-usd': { [HOUR_A]: 50000 } } as unknown as RatesByTimestamps;
        const current = { 'btc-usd': { [HOUR_A]: 99999 } } as unknown as RatesByTimestamps;

        const result = runInbound(
            buildInboundState({
                transactions: { 'acc-a': [btcTransaction(HOUR_A)] },
                historic,
                current,
                lastWeek: current,
            }),
            rememberedRootState,
        );

        expect(result.fiat).toEqual({
            current: {},
            lastWeek: {},
            historic: { 'btc-usd': { [HOUR_A]: 50000 } },
        });
    });

    it('does not throw on null/undefined entries in the transactions array', () => {
        const historic = { 'btc-usd': { [HOUR_A]: 50000 } } as unknown as RatesByTimestamps;

        const result = runInbound(
            buildInboundState({
                transactions: { 'acc-a': [null, btcTransaction(HOUR_A), undefined] },
                historic,
            }),
            rememberedRootState,
        );

        expect(result.fiat.historic).toEqual({ 'btc-usd': { [HOUR_A]: 50000 } });
    });

    it('still filters accounts and transactions by remembered device (regression)', () => {
        const historic = {} as unknown as RatesByTimestamps;

        const rootState = buildRootState([
            { remember: true, state: { staticSessionId: REMEMBERED_STATE } },
            { remember: false, state: { staticSessionId: NOT_REMEMBERED_STATE } },
        ]);

        const result = runInbound(
            buildInboundState({
                accounts: [
                    account('acc-a', REMEMBERED_STATE),
                    account('acc-b', NOT_REMEMBERED_STATE),
                ],
                transactions: {
                    [`acc-a-${REMEMBERED_STATE}`]: [btcTransaction(HOUR_A)],
                    [`acc-b-${NOT_REMEMBERED_STATE}`]: [btcTransaction(HOUR_B)],
                },
                historic,
            }),
            rootState,
        );

        expect(result.accounts).toEqual([account('acc-a', REMEMBERED_STATE)]);
        expect(Object.keys(result.transactions.transactions)).toEqual([
            `acc-a-${REMEMBERED_STATE}`,
        ]);
    });
});
