import '@suite-common/test-utils/globalOverrides';

import { createIntl } from 'react-intl';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { AssetDetailEarn } from './AssetDetailEarn';
import { ETH, ETH_ASSET_KEY, getEthAssetState } from './assetDetailTestState';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';

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

const renderEarn = (account: Account, stakedWei: string) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: getInitialState(account, stakedWei),
    });

    renderWithProviders(services, <AssetDetailEarn assetKey={ETH_ASSET_KEY} />);
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

    it('shows the whole balance as available while nothing is staked', () => {
        renderEarn(mockEthereumAccount(), '0');

        const card = screen.getByTestId('@asset-detail/earn');

        expect(card).toHaveTextContent(intl.formatMessage(messages.TR_STAKE_STAKED));
        expect(card.textContent?.match(/\$3,000/g)).toHaveLength(1);
        expect(card).toHaveTextContent('$0.00');
    });

    it('is left out while there is nothing to stake', () => {
        renderEarn(mockEthereumAccount('0'), '0');

        expect(screen.queryByTestId('@asset-detail/earn')).not.toBeInTheDocument();
    });
});
