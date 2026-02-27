import { Translation } from '@suite/intl';
import { EarnFlow } from '@suite-common/suite-types/src/staking';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Modal, Tooltip } from '@trezor/components';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useSupplyFormContext } from 'src/hooks/earn/useSupplyForm';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useAnalytics } from 'src/support/useAnalytics';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/earn/earnFormFields';

type SupplyButtonProps = {
    flow: EarnFlow;
};

export const SupplyButton = ({ flow }: SupplyButtonProps) => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const {
        account,
        network,
        onSubmit,
        handleSubmit,
        formState: { errors, isSubmitting },
        isComposing,
        watch,
        currency,
        isStakingDisabled: isCardanoStakingDisabled,
    } = useSupplyFormContext();
    const analytics = useAnalytics();
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(network.symbol);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, network.symbol));

    const isDeviceConnected = device?.connected && device?.available;

    const isCardano = account.networkType === 'cardano';

    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;
    // there is no input for cardano. Form validation should always pass
    const isFormInputsValid = !isCardano ? formIsValid && hasValues : !isCardanoStakingDisabled;
    const isDisabled = !isFormInputsValid || isSubmitting || (isDeviceConnected && isLocked());

    const onSupplyClick = () => {
        if (!isDeviceConnected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }

        if (isCardano) {
            // direct call for cardano as there is no need to validate inputs
            onSubmit();
        } else {
            handleSubmit(onSubmit)();
        }

        analytics.report({
            type: earnFlowToEventTypeMap[flow],
            payload: {
                action: 'continue',
                step: 'stake-form-modal',
                currency,
                networkSymbol: account.symbol,
            },
        });
    };

    const isLoading = isComposing || isSubmitting || isDiscoveryRunning || areFeesLoading;

    return (
        <Tooltip content={stakingMessageContent}>
            <Modal.Button
                isDisabled={isDisabled || isStakingDisabled}
                isLoading={isLoading}
                onClick={onSupplyClick}
                iconLeft={isStakingDisabled ? 'info' : undefined}
                data-testid="@modal/staking/continue-button"
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
