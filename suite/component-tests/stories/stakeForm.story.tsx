import { useMemo } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { StakeInputs } from '@trezor/suite/src/components/earn/modals/StakeModal/StakeForm/StakeInputs';
import { StakeFormContext, useStakeForm } from '@trezor/suite/src/hooks/earn/useStakeForm';

import { MockStoreStory } from '../gallery/storyProviders';
import { mockEthereumStakingAccount, mockStakingWalletState } from '../mocks/mockStakingState';

/**
 * `StakeModal` is the only place that provides `StakeFormContext`, and it also renders a modal,
 * the info cards and the submit button. This host reproduces just the provider, so the story is
 * the inputs and nothing else.
 */
const StakeInputsHost = ({ account }: { account: Account }) => {
    const stakeContextValues = useStakeForm({ account });

    if (!stakeContextValues.stakingLimits) {
        return null;
    }

    return (
        <StakeFormContext.Provider value={stakeContextValues}>
            <StakeInputs />
        </StakeFormContext.Provider>
    );
};

/** Balance is a prop so a test can drive the fraction-button and Max maths from a known number. */
export const EthereumStakeInputs = ({ balance = '2.5' }: { balance?: string }) => {
    // Memoized so a re-render (e.g. `component.update()`) keeps the same store instead of silently
    // resetting all Redux-sourced state mid-test.
    const { account, preloadedState } = useMemo(() => {
        const mockedAccount = mockEthereumStakingAccount(balance);

        return { account: mockedAccount, preloadedState: mockStakingWalletState(mockedAccount) };
    }, [balance]);

    return (
        <MockStoreStory preloadedState={preloadedState}>
            <StakeInputsHost account={account} />
        </MockStoreStory>
    );
};
