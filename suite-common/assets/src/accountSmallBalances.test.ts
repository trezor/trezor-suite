import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { FirmwareType, type StaticSessionId } from '@trezor/device-utils';

import { selectAccountSmallBalances } from './accountSmallBalances';
import { type AssetTableState } from './homeAssetTableSelectors';

const ALICE = 'aliceWallet@device:0' as StaticSessionId;
const ETH = asNetworkSymbol('eth');
const ADA = asNetworkSymbol('ada');
const USDC = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const ENS = toTokenAddress('0xc18360217d8f7ab5e7c516566761ea12ce7f9d72');

const mockToken = (contract: TokenAddress, symbol: string, balance: string, decimals: number) =>
    ({ standard: 'ERC20', contract, symbol, balance, decimals }) satisfies TokenInfo;

const account = {
    key: `descriptor0-eth-${ALICE}` as AccountKey,
    deviceState: ALICE,
    symbol: ETH,
    networkType: 'ethereum',
    formattedBalance: '1.2',
    tokens: [mockToken(USDC, 'USDC', '1000', 6), mockToken(ENS, 'ENS', '0.01', 18)],
    visible: true,
} as unknown as Account;

/** A Cardano account whose whole balance is delegated: the stake stays inside the balance. */
const adaAccount = {
    key: `adaDescriptor-ada-${ALICE}` as AccountKey,
    deviceState: ALICE,
    symbol: ADA,
    networkType: 'cardano',
    formattedBalance: '1',
    tokens: [],
    visible: true,
} as unknown as Account;

const ADA_DELEGATED = mockStakingPosition({
    lockup: 'liquid',
    balances: {
        staked: stakingAmountSchema.parse('1000000'),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('0'),
        withdrawable: stakingAmountSchema.parse('0'),
        rewards: stakingAmountSchema.parse('0'),
    },
    unlocks: [],
});

// A current rate carries the dollar rate too; in dollars the two are the same number.
const mockRate = (
    rate: number,
    contract?: TokenAddress,
    usdRate = rate,
    symbol: NetworkSymbol = ETH,
) => ({
    [getFiatRateKey(symbol, 'usd', contract)]: { rate, usdRate },
});

const createState = (rates: Record<string, { rate: number; usdRate: number }>) =>
    ({
        earn: { staking: mockStakingState({ positions: { [adaAccount.key]: [ADA_DELEGATED] } }) },
        device: {
            selectedDevice: {
                state: { staticSessionId: ALICE },
                firmwareType: FirmwareType.Universal,
            },
        },
        wallet: {
            accounts: [account, adaAccount],
            settings: { localCurrency: 'usd', enabledNetworks: [ETH, ADA] },
            fiat: { current: rates, lastWeek: {}, historic: {} },
        },
        tokenDefinitions: { [ETH]: { coin: { data: [USDC, ENS], hide: [], show: [] } } },
        networks: { [ETH]: { symbol: ETH, name: 'Ethereum' } },
    }) as unknown as AssetTableState;

describe('the small balances of an account', () => {
    it('are what it holds worth under a dollar, with how many and how much', () => {
        // 0.01 ENS at $20 is 20c; the ether and the USDC are worth far more.
        const state = createState({
            ...mockRate(3000),
            ...mockRate(1, USDC),
            ...mockRate(20, ENS),
        });
        const { keys, summary } = selectAccountSmallBalances(state, account.key);

        expect([...keys]).toEqual([ENS]);
        expect(summary?.assetCount).toBe(1);
        expect(summary?.fiatValue.toFixed()).toBe('0.2');
    });

    it('never count the coin, which the account overview always lists', () => {
        const state = createState({ ...mockRate(0.5, undefined, 0.5, ADA) });

        expect(selectAccountSmallBalances(state, adaAccount.key)).toEqual({
            keys: new Set(),
            summary: undefined,
        });
    });

    it('never count what has no rate, so nothing is hidden by mistake', () => {
        const state = createState({ ...mockRate(3000), ...mockRate(1, USDC) });

        expect(selectAccountSmallBalances(state, account.key)).toEqual({
            keys: new Set(),
            summary: undefined,
        });
    });

    it('are none for an account it does not know', () => {
        const state = createState({ ...mockRate(3000) });

        expect(selectAccountSmallBalances(state, 'unknown' as AccountKey).summary).toBeUndefined();
    });

    it('keep the result across a recreated state', () => {
        const state = createState({ ...mockRate(3000), ...mockRate(20, ENS) });

        expect(selectAccountSmallBalances(state, account.key)).toBe(
            selectAccountSmallBalances(state, account.key),
        );
    });

    it('keep the result across a rate update that changes no small balance', () => {
        const before = selectAccountSmallBalances(
            createState({ ...mockRate(3000), ...mockRate(1, USDC), ...mockRate(20, ENS) }),
            account.key,
        );
        // The ether moved, the ENS did not: the same small balances, worth the same.
        const after = selectAccountSmallBalances(
            createState({ ...mockRate(3100), ...mockRate(1, USDC), ...mockRate(20, ENS) }),
            account.key,
        );

        expect(after).toBe(before);
    });
});
