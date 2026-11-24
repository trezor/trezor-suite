import { type ReactNode, isValidElement } from 'react';
import { Provider } from 'react-redux';

import { render, screen, waitFor } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type BlockchainRootState, blockchainInitialState } from '@suite-common/wallet-core';
import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import { mockSolanaStakingAccount } from '@suite-common/wallet-types/mocks';
import { MAX_CLAIM_ACCOUNTS } from '@trezor/network-solana/constants';

import { SolanaStakingLimitBanner } from './SolanaStakingLimitBanner';

const claimMock = jest.fn();

jest.mock('@trezor/network-solana/runtime', () => ({
    __esModule: true,
    default: () =>
        Promise.resolve({
            selectSolanaConnection: jest.fn().mockReturnValue({}),
            unstake: jest.fn(),
            claim: claimMock,
        }),
}));
jest.mock('@suite/intl', () => ({
    Translation: ({ id, values }: { id: string; values: Record<string, unknown> }) =>
        `${id} ${JSON.stringify(values, (_key, value) =>
            isValidElement<{ networkSymbol: string }>(value)
                ? value.props.networkSymbol.toUpperCase()
                : value,
        )}`,
}));
jest.mock('@trezor/components', () => ({
    Banner: ({ description }: { description: ReactNode }) => (
        <div data-testid="banner">{description}</div>
    ),
}));

// Each account is claimed whole, so the amounts do not matter for the limit.
const mockDeactivatedAccount = (count: number): Account => {
    const account = mockSolanaStakingAccount('deactivated');
    const deactivated = account.misc?.solStakingAccounts?.[0];
    if (!deactivated) throw new Error('The deactivated scenario has no staking account.');

    return {
        ...account,
        misc: {
            ...account.misc,
            solStakingAccounts: Array.from({ length: count }, () => deactivated),
        },
    };
};

const composedLevels = {
    normal: { type: 'final', outputs: [{ amount: '1500000000' }] },
} as unknown as PrecomposedLevels;

const renderBanner = (deactivatedAccountCount: number) => {
    const { services } = createTestCompositionRoot<void, BlockchainRootState>({
        preloadedState: {
            wallet: {
                blockchain: {
                    ...blockchainInitialState,
                    sol: { ...blockchainInitialState.sol, url: 'https://solana.example' },
                },
            },
        },
    });

    return render(
        <Provider store={services.store}>
            <SolanaStakingLimitBanner
                account={mockDeactivatedAccount(deactivatedAccountCount)}
                composedLevels={composedLevels}
                type="claim"
            />
        </Provider>,
    );
};

describe('SolanaStakingLimitBanner claim', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        claimMock.mockResolvedValue({ totalClaimAmount: 16_000_000_000n });
    });

    it('stays hidden for a single deactivated account', async () => {
        renderBanner(1);

        await waitFor(() => expect(claimMock).toHaveBeenCalledTimes(1));
        expect(screen.queryByTestId('banner')).toBeNull();
    });

    it('stays hidden for exactly the number of accounts one transaction claims', async () => {
        renderBanner(MAX_CLAIM_ACCOUNTS);

        await waitFor(() => expect(claimMock).toHaveBeenCalledTimes(1));
        expect(screen.queryByTestId('banner')).toBeNull();
    });

    it('shows the limit and the amount of one transaction for more accounts', async () => {
        renderBanner(MAX_CLAIM_ACCOUNTS + 1);

        const banner = await screen.findByTestId('banner');

        expect(banner).toHaveTextContent('TR_STAKE_CAN_CLAIM_FROM_ACCOUNTS');
        expect(banner).toHaveTextContent('"limit":16');
        expect(banner).toHaveTextContent('"amount":"16"');
        expect(banner).toHaveTextContent('"symbol":"SOL"');
    });
});
