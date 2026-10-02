import { deviceInitialState } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor, toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    type AssetsRootState,
    selectAssetAccountBalances,
    selectAssetAvailableCryptoBalance,
    selectAssetHasStakingBalance,
    selectAssetName,
    selectAssetStakingCryptoBalance,
    selectAssetTicker,
} from './assetSelectors';

const ethereumSymbol = asNetworkSymbol('eth');
const tokenContract = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const device = mockSuiteDevice();
const accountWithToken = mockWalletAccount({
    symbol: ethereumSymbol,
    deviceState: device.state?.staticSessionId,
    tokens: [
        mockAccountToken({
            contract: tokenContract,
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '2',
        }),
    ],
});
const accountWithoutToken = mockWalletAccount({
    symbol: ethereumSymbol,
    descriptor: asAccountDescriptor('second-account'),
    deviceState: device.state?.staticSessionId,
});

const state: AssetsRootState = {
    wallet: {
        accounts: [accountWithToken, accountWithoutToken],
    },
    device: {
        ...deviceInitialState,
        devices: [device],
        selectedDevice: device,
    },
};

describe('asset selectors', () => {
    it('selects the ticker and name of a native asset', () => {
        expect(selectAssetTicker(state, ethereumSymbol)).toBe('ETH');
        expect(selectAssetName(state, ethereumSymbol)).toBe('Ethereum');
    });

    it('selects the ticker and name of a token', () => {
        expect(selectAssetTicker(state, ethereumSymbol, tokenContract)).toBe('USDC');
        expect(selectAssetName(state, ethereumSymbol, tokenContract)).toBe('USD Coin');
    });

    it('selects balances for every native asset account', () => {
        expect(selectAssetAccountBalances(state, ethereumSymbol)).toEqual([
            {
                accountKey: accountWithToken.key,
                accountLabel: accountWithToken.accountLabel,
                cryptoBalance: '0',
            },
            {
                accountKey: accountWithoutToken.key,
                accountLabel: accountWithoutToken.accountLabel,
                cryptoBalance: '0',
            },
        ]);
    });

    it('selects balances only for accounts containing a token', () => {
        expect(selectAssetAccountBalances(state, ethereumSymbol, tokenContract)).toEqual([
            {
                accountKey: accountWithToken.key,
                accountLabel: accountWithToken.accountLabel,
                cryptoBalance: '2',
            },
        ]);
    });

    it('splits a native asset balance into available and staking balances', () => {
        const accountWithStaking = mockWalletAccount(
            {
                symbol: ethereumSymbol,
                deviceState: device.state?.staticSessionId,
                formattedBalance: '1',
            },
            {
                misc: {
                    stakingPools: [
                        {
                            name: 'Everstake',
                            contract: '0x456',
                            autocompoundBalance: '2000000000000000000',
                            claimableAmount: '0',
                            depositedBalance: '2000000000000000000',
                            pendingBalance: '0',
                            pendingDepositedBalance: '0',
                            restakedReward: '0',
                            withdrawTotalAmount: '0',
                        },
                    ],
                },
            },
        );
        const accountWithoutStaking = mockWalletAccount({
            symbol: ethereumSymbol,
            descriptor: asAccountDescriptor('second-account'),
            deviceState: device.state?.staticSessionId,
            formattedBalance: '3',
        });
        const stateWithStaking: AssetsRootState = {
            ...state,
            wallet: {
                accounts: [accountWithStaking, accountWithoutStaking],
            },
        };

        expect(selectAssetAvailableCryptoBalance(stateWithStaking, ethereumSymbol)).toBe('4');
        expect(selectAssetStakingCryptoBalance(stateWithStaking, ethereumSymbol)).toBe('2');
        expect(selectAssetHasStakingBalance(stateWithStaking, ethereumSymbol)).toBe(true);
    });
});
