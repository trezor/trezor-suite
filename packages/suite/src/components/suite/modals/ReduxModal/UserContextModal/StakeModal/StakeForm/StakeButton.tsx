import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Modal, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useStakeFormContext } from 'src/hooks/wallet/useStakeForm';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';

export const StakeButton = () => {
    const { device, isLocked } = useDevice();
    const selectedAccount = useSelector(
        state => state.wallet.selectedAccount,
    ) as SelectedAccountLoaded;
    const {
        onSubmit,
        handleSubmit,
        formState: { errors, isSubmitting },
        isComposing,
        watch,
        currency,
    } = useStakeFormContext();
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(
        selectedAccount.network.symbol,
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector(state =>
        selectAreFeesLoading(state, selectedAccount.network.symbol),
    );

    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;
    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || isLocked() || !device?.available;

    const onStakeClick = () => {
        handleSubmit(onSubmit)();

        analytics.report({
            type: EventType.StakingStake,
            payload: {
                action: 'continue',
                step: 'stake-form-modal',
                currency,
                networkSymbol: selectedAccount.account.symbol,
            },
        });
    };

    const isLoading = isComposing || isSubmitting || isDiscoveryRunning || areFeesLoading;

    return (
        <Tooltip content={stakingMessageContent}>
            <Modal.Button
                isDisabled={isDisabled || isStakingDisabled}
                isLoading={isLoading}
                onClick={onStakeClick}
                icon={isStakingDisabled ? 'info' : undefined}
                data-testid="@modal/staking/continue-button"
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
