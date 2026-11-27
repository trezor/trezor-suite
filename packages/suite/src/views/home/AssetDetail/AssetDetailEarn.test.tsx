import '@suite-common/test-utils/globalOverrides';

import { createIntl } from 'react-intl';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { type StakingDep } from '@suite-common/earn-staking';
import {
    mockStakingQueryClient,
    mockStakingServices,
    mockStakingState,
} from '@suite-common/earn-staking/mocks';
import {
    type StakingProductId,
    type StakingProductInfo,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AssetDetailEarn } from './AssetDetailEarn';
import { ETH, ETH_ASSET_KEY, getEthAssetState } from './assetDetailTestState';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const ONE_ETH_IN_WEI = '1000000000000000000';

const amount = (value: string) => stakingAmountSchema.parse(value);

/** `balance` ether to spend. */
const mockEthereumAccount = (balance = '1'): Account =>
    mockWalletAccount({ symbol: ETH, formattedBalance: balance });

/** `stakedWei` with Everstake, on top of the balance. */
const mockStake = (stakedWei: string) =>
    mockStakingPosition({
        balances: {
            staked: amount(stakedWei),
            pending: amount('0'),
            unstaking: amount('0'),
            withdrawable: amount('0'),
            rewards: amount('0'),
        },
        unlocks: [],
    });

const getInitialState = (account: Account, stakedWei: string): MockSuiteState => {
    const state = getEthAssetState({ accounts: [account], ethRate: 3000 });

    return {
        ...state,
        earn: {
            staking: mockStakingState({
                positions: stakedWei === '0' ? {} : { [account.key]: [mockStake(stakedWei)] },
            }),
        },
    };
};

const ETH_PRODUCT = mockStakingProductDescriptor();

const ETH_INFO = mockStakingProductInfo({ rate: 3.2 });

type RenderParams = {
    productInfo?: Partial<Record<StakingProductId, StakingProductInfo>>;
};

const renderEarn = (
    account: Account,
    stakedWei: string,
    { productInfo = { [ETH_PRODUCT.id]: ETH_INFO } }: RenderParams = {},
) => {
    const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
        preloadedState: getInitialState(account, stakedWei),
        services: () => ({ staking: mockStakingServices() }),
    });

    // What the staking API says the network pays, as the Earn badges show it.
    renderWithProviders(services, <AssetDetailEarn assetKey={ETH_ASSET_KEY} />, {
        queryClient: mockStakingQueryClient({ productInfo }),
    });
};

const intl = createIntl({ locale: 'en' });

describe('the earn card on the asset screen', () => {
    it('splits what is held into what is available and what is staking, at what rate', () => {
        renderEarn(mockEthereumAccount(), ONE_ETH_IN_WEI);

        const card = screen.getByTestId('@asset-detail/earn');

        expect(card).toHaveTextContent(intl.formatMessage(messages.TR_STAKE_AVAILABLE));
        expect(card).toHaveTextContent(intl.formatMessage(messages.TR_STAKE_STAKED));
        // The rate as the Earn badges word it, the number in the locale's own format.
        expect(card).toHaveTextContent(/3\.2\S*\s?APY/);
        // A staked ether and one to spend, each worth $3,000.
        expect(card.textContent?.match(/\$3,000/g)).toHaveLength(2);
    });

    it('says the rate is not available for a product without one, a testnet, once cached', () => {
        renderEarn(mockEthereumAccount(), ONE_ETH_IN_WEI, {
            productInfo: { [ETH_PRODUCT.id]: mockStakingProductInfo({ rate: null }) },
        });

        expect(screen.getByTestId('@asset-detail/earn')).toHaveTextContent(
            intl.formatMessage(messages.TR_EARN_APY_NOT_AVAILABLE),
        );
    });

    it('shows no rate while the product info is not cached', () => {
        renderEarn(mockEthereumAccount(), ONE_ETH_IN_WEI, { productInfo: {} });

        expect(screen.getByTestId('@asset-detail/earn')).not.toHaveTextContent(/APY/);
    });

    it('shows the whole balance as available while nothing is staked', () => {
        renderEarn(mockEthereumAccount(), '0');

        const card = screen.getByTestId('@asset-detail/earn');

        expect(card).toHaveTextContent(intl.formatMessage(messages.TR_STAKE_STAKED));
        expect(card.textContent?.match(/\$3,000/g)).toHaveLength(1);
        expect(card).toHaveTextContent('$0.00');
    });

    it('omits the allocation bar when all TRX is unstaking', () => {
        const networkSymbol = asNetworkSymbol('trx');
        const account = mockWalletAccount(
            { symbol: networkSymbol, formattedBalance: '0' },
            { networkType: 'tron' },
        );
        const { deviceState } = account;
        const product = mockStakingProductDescriptor({ networkSymbol, type: 'native' });
        const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
            preloadedState: {
                ...mockInitialAppState,
                networks: mockNetworksState([networkSymbol]),
                device: {
                    ...mockInitialAppState.device,
                    selectedDevice: mockSuiteDevice({ state: { staticSessionId: deviceState } }),
                },
                wallet: {
                    ...mockInitialAppState.wallet,
                    accounts: [account],
                    settings: {
                        ...mockInitialAppState.wallet.settings,
                        enabledNetworks: [networkSymbol],
                    },
                },
                earn: {
                    staking: mockStakingState({
                        descriptors: [product],
                        positions: {
                            [account.key]: [
                                mockStakingPosition({
                                    productId: product.id,
                                    balances: {
                                        staked: amount('0'),
                                        pending: amount('0'),
                                        unstaking: amount('10000000'),
                                        withdrawable: amount('0'),
                                        rewards: amount('0'),
                                    },
                                }),
                            ],
                        },
                    }),
                },
            },
            services: () => ({ staking: mockStakingServices() }),
        });

        const assetKey = getWalletAssetKey({ deviceState, networkSymbol });
        renderWithProviders(services, <AssetDetailEarn assetKey={assetKey} />);

        expect(screen.getByTestId('@asset-detail/earn')).toBeInTheDocument();
        expect(screen.queryByTestId('@asset-detail/earn/allocation')).not.toBeInTheDocument();
    });

    it('is left out while there is nothing to stake', () => {
        renderEarn(mockEthereumAccount('0'), '0');

        expect(screen.queryByTestId('@asset-detail/earn')).not.toBeInTheDocument();
    });
});
