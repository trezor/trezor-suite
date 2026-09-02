import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { setConnectionModal, setConnectionMode, useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type StakeModalFlow } from '@suite-common/suite-types/src/staking';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Modal, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { earnFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useStakeFormContext } from 'src/hooks/earn/useStakeForm';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/earn/earnFormFields';

type StakeButtonProps = {
    flow: StakeModalFlow;
};

export const StakeButton = ({ flow }: StakeButtonProps) => {
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
    } = useStakeFormContext();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
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

    const onStakeClick = () => {
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
                onClick={onStakeClick}
                iconLeft={isStakingDisabled ? InfoIcon : undefined}
                data-testid="@modal/staking/continue-button"
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
