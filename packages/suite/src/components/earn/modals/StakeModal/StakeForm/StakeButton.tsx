import { injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { EarnFlow, type StakeModalFlow } from '@suite-common/suite-types/src/staking';
import {
    isCardanoDrepIdCip129,
    selectAreFeesLoading,
    selectHasRunningDiscovery,
    selectVotingDelegationOption,
} from '@suite-common/wallet-core';
import { Modal, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { InfoIcon } from '@trezor/icons';

import { earnFlowToEventTypeMap } from '#src/constants/suite/staking';
import { useEarnDeviceStatus } from '#src/hooks/earn/useEarnDeviceStatus';
import { useStakeFormContext } from '#src/hooks/earn/useStakeForm';
import { useMessageSystemStaking } from '#src/hooks/suite/useMessageSystemStaking';
import { useSelector } from '#src/hooks/suite/useSelector';
import { CRYPTO_INPUT, FIAT_INPUT } from '#src/types/earn/earnFormFields';

type StakeButtonProps = {
    flow: StakeModalFlow;
};

export const StakeButton = ({ flow }: StakeButtonProps) => {
    // React Compiler: `watch` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const deviceStatus = useEarnDeviceStatus();
    const { device, isLocked } = useDevice();
    const {
        account,
        network,
        onSubmit,
        handleSubmit,
        formState: { errors, isSubmitting },
        isComposing,
        isLoading: isSigning,
        composedLevels,
        selectedFee,
        watch,
        currency,
        isStakingDisabled: isCardanoStakingDisabled,
    } = useStakeFormContext();
    const { analytics } = useServices(injectDesktopAnalytics);
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(network.symbol);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, network.symbol));
    const selectedVotingDelegation = useSelector(state =>
        selectVotingDelegationOption(state, account.key),
    );

    const isDeviceConnected = device?.connected && device?.available;

    const isCardano = account.networkType === 'cardano';

    const isDrepValid =
        selectedVotingDelegation.type !== 'another_drep' ||
        isCardanoDrepIdCip129(selectedVotingDelegation.drepId);

    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;
    // there is no input for cardano. Form validation should always pass
    const isFormInputsValid = !isCardano
        ? formIsValid && hasValues
        : isDrepValid && (!isDeviceConnected || !isCardanoStakingDisabled);
    // Cardano signs straight from onSubmit without handleSubmit, so isSubmitting stays false, and
    // the device lock is taken only after the transaction plan is composed.
    const isDisabled =
        !isFormInputsValid ||
        isSubmitting ||
        isSigning ||
        (isDeviceConnected && (isLocked() || composedLevels?.[selectedFee]?.type !== 'final'));

    const onStakeClick = () => {
        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
                deviceStatus,
                step: 'stake-form-modal',
                currency,
                networkSymbol: account.symbol,
                ...(flow === EarnFlow.UpdateProvider && isCardano
                    ? { votingDelegation: selectedVotingDelegation.type }
                    : {}),
            },
        });

        if (isCardano) {
            // direct call for cardano as there is no need to validate inputs
            onSubmit();
        } else {
            handleSubmit(onSubmit)();
        }
    };

    const isLoading =
        isComposing || isSubmitting || isSigning || isDiscoveryRunning || areFeesLoading;

    return (
        <Tooltip content={stakingMessageContent}>
            <Modal.Button
                isDisabled={isDisabled || isStakingDisabled}
                isLoading={isLoading}
                onClick={onStakeClick}
                iconLeft={isStakingDisabled ? InfoIcon : undefined}
                data-testid="@modal/staking/continue-button"
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
