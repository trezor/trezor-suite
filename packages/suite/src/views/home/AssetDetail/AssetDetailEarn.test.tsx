import '@suite-common/test-utils/globalOverrides';

import { createIntl } from 'react-intl';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { AssetDetailEarn } from './AssetDetailEarn';
import { ETH, ETH_ASSET_KEY, getEthAssetState } from './assetDetailTestState';

const ONE_ETH_IN_WEI = '1000000000000000000';

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

const getInitialState = (account: Account): AppState => {
    const state = getEthAssetState({ accounts: [account], ethRate: 3000 });

    return {
        ...state,
        wallet: {
            ...state.wallet,
            stake: {
                ...state.wallet.stake,
                data: {
                    ...state.wallet.stake.data,
                    data: {
                        ...state.wallet.stake.data.data,
                        eth: { stats: { apy: 3.2, nextRewardPayout: 0 }, validators: {} },
                    },
                },
            },
        },
    };
};

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
