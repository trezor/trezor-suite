import '@suite-common/test-utils/globalOverrides';

import { type PropsWithChildren } from 'react';

import { screen } from '@testing-library/react';

import { type StakingPosition } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';

import { useCardanoStaking } from '#src/hooks/earn/useCardanoStaking';
import { useClaimForm } from '#src/hooks/earn/useClaimForm';
import {
    adaAccount,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    renderStakingDashboardComponent,
    solAccount,
    solProduct,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { EarnClaimModal } from './EarnClaimModal';

const onClaimChange = jest.fn();

// The form, the fees and the Cardano compose reach the backend; the amounts shown do not.
jest.mock('#src/hooks/earn/useClaimForm', () => ({ useClaimForm: jest.fn() }));
jest.mock('#src/hooks/earn/useCardanoStaking', () => ({ useCardanoStaking: jest.fn() }));
jest.mock('#src/components/wallet/Fees/Fees', () => ({ Fees: () => null }));
jest.mock(
    '#src/components/suite/modals/ReduxModal/UserContextModal/SolanaStakingLimitBanner',
    () => ({
        SolanaStakingLimitBanner: () => null,
    }),
);
jest.mock('@suite/form', () => ({
    Form: ({ children }: PropsWithChildren) => <form>{children}</form>,
}));

const zeroBalances = {
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
};

const renderModal = (account: Account, position: StakingPosition) =>
    renderStakingDashboardComponent(<EarnClaimModal account={account} />, {
        state: createStakingDashboardState({
            accounts: [account],
            positions: { [account.key]: [position] },
        }),
    });

describe('EarnClaimModal', () => {
    beforeEach(() => {
        onClaimChange.mockClear();

        jest.mocked(useClaimForm).mockReturnValue({
            formState: { errors: {}, isSubmitting: false },
            changeFeeLevel: jest.fn(),
            feeInfo: undefined,
            composedLevels: undefined,
            watch: () => '1',
            isComposing: false,
            handleSubmit: (callback: () => void) => callback,
            onClaimChange,
            signTx: jest.fn(),
            methods: { formState: {} },
            isClaimingDisabled: false,
        } as unknown as ReturnType<typeof useClaimForm>);

        jest.mocked(useCardanoStaking).mockReturnValue({
            calculateFeeAndDeposit: jest.fn(),
            withdrawingAvailable: { status: true },
            delegatingAvailable: { status: true },
            fee: '174301',
            deposit: undefined,
            rewards: '56398',
            loading: false,
            isStakingDisabled: false,
        });
    });

    it('claims the unstaked principal of an Ethereum position', () => {
        renderModal(
            ethAccount,
            mockPosition(ethProduct.id, {
                balances: {
                    ...zeroBalances,
                    staked: amount('1000000000000000000'),
                    withdrawable: amount('500000000000000000'),
                },
                operations: ['stake', 'unstake', 'withdraw'],
            }),
        );

        expect(screen.getByTestId('@staking/claim-modal/amount-with-symbol')).toHaveTextContent(
            '0.5 ETH',
        );
        expect(onClaimChange).toHaveBeenCalledWith('0.5');
    });

    it('claims the deactivated stake of a Solana position', () => {
        renderModal(
            solAccount,
            mockPosition(solProduct.id, {
                balances: {
                    ...zeroBalances,
                    staked: amount('1000000000'),
                    withdrawable: amount('1500000000'),
                },
                operations: ['stake', 'unstake', 'withdraw'],
            }),
        );

        expect(screen.getByTestId('@staking/claim-modal/amount-with-symbol')).toHaveTextContent(
            '1.5 SOL',
        );
        expect(onClaimChange).toHaveBeenCalledWith('1.5');
    });

    it('claims the reward balance of a Cardano delegation', () => {
        renderModal(
            adaAccount,
            mockPosition(adaEverstakeProduct.id, {
                lockup: 'liquid',
                balances: {
                    ...zeroBalances,
                    staked: amount('100056398'),
                    rewards: amount('56398'),
                },
                operations: ['unstake', 'claim', 'vote'],
                details: { kind: 'cardano-delegation', poolId: null, drep: null },
            }),
        );

        expect(screen.getByTestId('@modal/claim/rewards-amount-with-symbol')).toHaveTextContent(
            '0.056398 ADA',
        );
        expect(onClaimChange).toHaveBeenCalledWith('0.056398');
    });
});
