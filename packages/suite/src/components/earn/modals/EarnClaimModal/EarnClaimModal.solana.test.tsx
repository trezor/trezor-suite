import '@testing-library/jest-dom';

import { type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { stakingActions, stakingReducer } from '@suite-common/earn-staking';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { messageSystemInitialState } from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockSolanaStakingAccount } from '@suite-common/wallet-types/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';
import { type Dispatch, type DispatchDep } from '@trezor/redux-utils';

import { EarnClaimModal } from './EarnClaimModal';

const initialAccount = mockSolanaStakingAccount('deactivated');
const mockOnClaimChange = jest.fn();

jest.mock('@suite/device', () => ({
    ...jest.requireActual('@suite/device'),
    useDevice: () => ({ device: { connected: true, available: true }, isLocked: () => false }),
}));
jest.mock('@suite/form', () => ({ Form: ({ children }: PropsWithChildren) => children }));
jest.mock('@suite/intl', () => ({ Translation: ({ id }: { id: string }) => id }));
jest.mock('@trezor/components', () => {
    const Container = ({ children }: PropsWithChildren) => children;
    const Modal = ({
        children,
        bottomContent,
    }: PropsWithChildren<{ bottomContent: React.ReactNode }>) => (
        <div>
            {children}
            {bottomContent}
        </div>
    );
    Modal.Button = ({ children, isDisabled }: PropsWithChildren<{ isDisabled?: boolean }>) => (
        <button disabled={isDisabled}>{children}</button>
    );

    return {
        Modal,
        Card: Container,
        Column: Container,
        InfoItem: Container,
        Paragraph: Container,
        Row: Container,
        Tooltip: Container,
        Banner: ({ description }: { description: React.ReactNode }) => <div>{description}</div>,
    };
});
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectHasRunningDiscovery: () => false,
    selectAreFeesLoading: () => false,
}));
jest.mock('#src/hooks/earn/useClaimForm', () => ({
    useClaimForm: () => ({
        formState: { errors: {}, isSubmitting: false },
        methods: { formState: {} },
        watch: () => '1',
        onClaimChange: mockOnClaimChange,
    }),
}));
jest.mock('#src/hooks/earn/useCardanoStaking', () => ({
    useCardanoStaking: () => ({
        withdrawingAvailable: { status: true },
        calculateFeeAndDeposit: jest.fn(),
    }),
}));
jest.mock('#src/hooks/earn/useEarnDeviceStatus', () => ({
    useEarnDeviceStatus: () => 'connected',
}));
jest.mock('#src/hooks/suite/useMessageSystemStaking', () => ({
    useMessageSystemStaking: () => ({ isClaimingDisabled: false }),
}));
jest.mock('#src/components/suite/BaseCurrencyValue', () => ({ BaseCurrencyValue: () => null }));
jest.mock('#src/components/suite/FormattedCryptoAmount', () => ({
    FormattedCryptoAmount: ({
        value,
        'data-testid': testId,
    }: {
        value: string;
        'data-testid': string;
    }) => <span data-testid={testId}>{value}</span>,
}));
jest.mock('#src/components/wallet/Fees/Fees', () => ({ Fees: () => null }));
jest.mock(
    '#src/components/suite/modals/ReduxModal/UserContextModal/SolanaStakingLimitBanner',
    () => ({
        SolanaStakingLimitBanner: () => null,
    }),
);

it('updates an open claim modal after the claimable stake disappears from the store', () => {
    const product = mockStakingProductDescriptor({
        networkSymbol: asNetworkSymbol('sol'),
        type: 'native',
        operations: ['stake', 'unstake', 'withdraw'],
        rewardsKind: 'expected',
    });
    const zero = stakingAmountSchema.parse('0');
    const position = mockStakingPosition({
        productId: product.id,
        balances: {
            staked: zero,
            pending: zero,
            unstaking: zero,
            withdrawable: stakingAmountSchema.parse('1000000000'),
            rewards: zero,
        },
        unlocks: [],
        targets: [],
        operations: ['stake', 'unstake', 'withdraw'],
    });
    const store = configureStore({
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            device: (state = { selectedDevice: undefined }) => state,
            messageSystem: (state = messageSystemInitialState) => state,
            wallet: (state = { accounts: [initialAccount] }) => state,
        },
        preloadedState: {
            earn: {
                staking: mockStakingState({
                    platform: 'desktop',
                    descriptors: [product],
                    positions: { [initialAccount.key]: [position] },
                }),
            },
        },
    });
    const services: DesktopAnalyticsDep & { store: DispatchDep } = {
        analytics: mockDesktopAnalytics(),
        store: { dispatch: mock<Dispatch>() },
    };
    const view = render(
        <Provider store={store}>
            <ServicesProvider services={services}>
                <EarnClaimModal account={initialAccount} />
            </ServicesProvider>
        </Provider>,
    );
    expect(view.getByRole('button', { name: 'TR_CONTINUE' })).toBeEnabled();

    act(() => {
        store.dispatch(
            stakingActions.positionsSynced({ accountKey: initialAccount.key, positions: [] }),
        );
    });

    expect(view.getByTestId('@staking/claim-modal/amount')).toHaveTextContent(/^0$/);
    expect(view.getByRole('button', { name: 'TR_CONTINUE' })).toBeDisabled();
    expect(view.getByText('TR_STAKE_SOL_NOTHING_TO_CLAIM')).toBeVisible();
    expect(mockOnClaimChange).toHaveBeenLastCalledWith('0');
});
