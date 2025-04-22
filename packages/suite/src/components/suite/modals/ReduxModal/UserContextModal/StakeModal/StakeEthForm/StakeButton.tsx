import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Modal, Tooltip } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { Translation } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
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
    } = useStakeEthFormContext();
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(
        selectedAccount.network.symbol,
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

    return (
        <Tooltip content={stakingMessageContent}>
            <Modal.Button
                isDisabled={isDisabled || isStakingDisabled}
                isLoading={isComposing || isSubmitting}
                onClick={onStakeClick}
                icon={isStakingDisabled ? 'info' : undefined}
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
