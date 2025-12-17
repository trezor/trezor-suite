import { Translation } from '@suite/intl';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Modal, Tooltip } from '@trezor/components';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { stakingFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useStakeFormContext } from 'src/hooks/wallet/useStakeForm';
import { useLegacyAnalytics } from 'src/support/useAnalytics';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';

interface StakeButtonProps {
    flow: StakingFlow;
}

export const StakeButton = ({ flow }: StakeButtonProps) => {
    const dispatch = useDispatch();
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
        isStakingDisabled: isCardanoStakingDisabled,
    } = useStakeFormContext();
    const legacyAnalytics = useLegacyAnalytics();
    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(
        selectedAccount.network.symbol,
    );
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector(state =>
        selectAreFeesLoading(state, selectedAccount.network.symbol),
    );

    const isDeviceConnected = device?.connected && device?.available;

    const isCardano = selectedAccount.account.networkType === 'cardano';

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

        legacyAnalytics.report({
            type: stakingFlowToEventTypeMap[flow],
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
                iconLeft={isStakingDisabled ? 'info' : undefined}
                data-testid="@modal/staking/continue-button"
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
