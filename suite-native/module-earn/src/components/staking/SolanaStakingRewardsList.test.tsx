import { RefreshControl } from 'react-native';

import { type SolRewardsHistoryRewardsItem } from '@suite-common/earn-staking-api';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { act, renderWithStoreProvider, waitFor } from '@suite-native/test-utils-store';

import { SolanaStakingRewardsList } from './SolanaStakingRewardsList';

const SOL_REWARDS_HISTORY_PATH = '/sol/rewards/:address';
const MAINNET_REWARD: SolRewardsHistoryRewardsItem = {
    epoch: 700,
    delegator: 'stake-account',
    amount: '1000',
    currency: 'SOL',
    time: '2026-11-01T00:00:00.000Z',
};

let mockRequestedPaths: string[] = [];
let mockRewards: SolRewardsHistoryRewardsItem[] = [];

// The staking API services are built from the HTTP client at module load, so a recording
// client stands in for the worker.
jest.mock('@suite-common/http-client', () => ({
    ...jest.requireActual('@suite-common/http-client'),
    createHttpClient: () => () => (path: string) => () => {
        mockRequestedPaths.push(path);

        return Promise.resolve({ rewards: mockRewards, totalCount: mockRewards.length });
    },
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    fetchAndUpdateAccountThunk: (payload: unknown) => ({ type: 'test/fetch-account', payload }),
}));

// React Native's jest mock renders the refresh control without its props and keeps the latest
// instance instead, which is how a pull is simulated.
type RefreshControlMock = { latestRef: { props: { onRefresh: () => void } } };

const getRewardsRequestCount = () =>
    mockRequestedPaths.filter(path => path === SOL_REWARDS_HISTORY_PATH).length;

// A devnet account derives the same address as its mainnet sibling.
const mockSolanaAccount = (symbol: 'sol' | 'dsol') =>
    mockWalletAccount({
        symbol: asNetworkSymbol(symbol),
        descriptor: asAccountDescriptor('SharedSo1anaAddress11111111111111111111111111'),
    });

const renderList = async (account: Account) => {
    const onRefresh = jest.fn(() => Promise.resolve());
    const screen = await renderWithStoreProvider(
        <SolanaStakingRewardsList
            key={account.key}
            account={account}
            listHeaderComponent={<></>}
            onRefresh={onRefresh}
        />,
    );

    return { screen, onRefresh };
};

const pullToRefresh = async () => {
    await act(() => {
        (RefreshControl as unknown as RefreshControlMock).latestRef.props.onRefresh();
    });
    await act(() => new Promise(resolve => setTimeout(resolve, 0)));
};

beforeEach(() => {
    mockRequestedPaths = [];
    mockRewards = [];
});

describe('SolanaStakingRewardsList', () => {
    it('refetches the rewards of a mainnet account on pull', async () => {
        const { onRefresh } = await renderList(mockSolanaAccount('sol'));
        await waitFor(() => expect(getRewardsRequestCount()).toBe(1));

        await pullToRefresh();

        expect(onRefresh).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(getRewardsRequestCount()).toBe(2));
    });

    it('leaves the rewards of a devnet account alone on pull, as the API serves mainnet only', async () => {
        const { onRefresh } = await renderList(mockSolanaAccount('dsol'));

        await pullToRefresh();

        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(getRewardsRequestCount()).toBe(0);
    });

    it('does not show the mainnet rewards of the same address on a devnet account', async () => {
        mockRewards = [MAINNET_REWARD];
        const { screen } = await renderList(mockSolanaAccount('sol'));
        const itemLabel = getTranslation('earn.stakingManagementScreen.rewardsList.itemLabel');
        await screen.findByText(itemLabel);

        // A different key mounts a fresh list, as navigating to the devnet screen does, on the
        // same query client.
        const devnetAccount = mockSolanaAccount('dsol');
        screen.rerender(
            <SolanaStakingRewardsList
                key={devnetAccount.key}
                account={devnetAccount}
                listHeaderComponent={<></>}
            />,
        );

        await screen.findByText(
            getTranslation('earn.stakingManagementScreen.rewardsList.empty.title'),
        );
        expect(screen.queryByText(itemLabel)).toBeNull();
        expect(getRewardsRequestCount()).toBe(1);
    });
});
