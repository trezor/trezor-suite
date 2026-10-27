import '@suite-common/test-utils/globalOverrides';

import { createIntl } from 'react-intl';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type CurrentRate, type Timestamp } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailEarn } from './AssetDetailEarn';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');

const ETH_ASSET_KEY = getWalletAssetKey({ deviceState: DEVICE_STATE, symbol: ETH });

const ONE_ETH_IN_WEI = '1000000000000000000';

const mockRate = (rate: number) =>
    ({
        rate,
        usdRate: rate,
        lastTickerTimestamp: 1700000000000 as Timestamp,
        lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
        isLoading: false,
        error: null,
    }) as CurrentRate;

/** One ether to spend, and `stakedWei` of it with Everstake. */
const mockEthereumAccount = (stakedWei: string): Account =>
    ({
        ...mockWalletAccount({ symbol: ETH, formattedBalance: '1' }),
        networkType: 'ethereum',
        misc: {
            nonce: '0',
            stakingPools: [
                {
                    contract: '',
                    name: 'Everstake',
                    autocompoundBalance: stakedWei,
                    pendingBalance: '0',
                    pendingDepositedBalance: '0',
                    withdrawTotalAmount: '0',
                    claimableAmount: '0',
                    depositedBalance: '0',
                    restakedReward: '0',
                },
            ],
        },
    }) as Account;

const getInitialState = (account: Account): AppState => ({
    ...mockInitialAppState,
    networks: mockNetworksState([ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [account],
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [ETH],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: { [getFiatRateKey(ETH, 'usd')]: mockRate(3000) },
        },
        stake: {
            ...mockInitialAppState.wallet.stake,
            data: {
                ...mockInitialAppState.wallet.stake.data,
                data: {
                    ...mockInitialAppState.wallet.stake.data.data,
                    eth: { stats: { apy: 3.2, nextRewardPayout: 0 }, validators: {} },
                },
            },
        },
    },
});

const renderEarn = (account: Account) => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: getInitialState(account),
    });

    renderWithProviders(services, <AssetDetailEarn assetKey={ETH_ASSET_KEY} />);
};

const intl = createIntl({ locale: 'en' });

describe('the earn card on the asset screen', () => {
    it('splits what is held into what is available and what is staking, at what rate', () => {
        renderEarn(mockEthereumAccount(ONE_ETH_IN_WEI));

        const card = screen.getByTestId('@asset-detail/earn');

        expect(card).toHaveTextContent(intl.formatMessage(messages.TR_STAKE_AVAILABLE));
        expect(card).toHaveTextContent(intl.formatMessage(messages.TR_STAKE_STAKED));
        // The rate as the Earn badges word it, the number in the locale's own format.
        expect(card).toHaveTextContent(/3\.2\S*\s?APY/);
        // A staked ether and one to spend, each worth $3,000.
        expect(card.textContent?.match(/\$3,000/g)).toHaveLength(2);
    });

    it('is left out while nothing is staked', () => {
        renderEarn(mockEthereumAccount('0'));

        expect(screen.queryByTestId('@asset-detail/earn')).not.toBeInTheDocument();
    });
});
