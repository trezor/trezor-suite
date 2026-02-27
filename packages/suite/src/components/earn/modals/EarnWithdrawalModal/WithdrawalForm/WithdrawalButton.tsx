import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Modal, Tooltip } from '@trezor/components';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { useWithdrawalFormContext } from 'src/hooks/earn/useWithdrawalForm';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useAnalytics } from 'src/support/useAnalytics';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/earn/earnFormFields';

export const WithdrawalButton = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const { account, network, isComposing, formState, handleSubmit, watch, signTx, currency } =
        useWithdrawalFormContext();
    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking(
        network.symbol,
    );
    const analytics = useAnalytics();
    const { isSubmitting, errors } = formState;
    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const isDeviceConnected = device?.connected && device?.available;

    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || (isDeviceConnected && isLocked());
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, network.symbol));

    const onWithdrawalClick = () => {
        if (!isDeviceConnected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }

        handleSubmit(signTx)();

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                step: 'unstake-form-modal',
                currency,
                networkSymbol: account.symbol,
            },
        });
    };

    const isLoading = isComposing || isSubmitting || isDiscoveryRunning || areFeesLoading;

    return (
        <Tooltip content={unstakingMessageContent}>
            <Modal.Button
                isDisabled={isDisabled || isUnstakingDisabled}
                isLoading={isLoading}
                onClick={onWithdrawalClick}
                iconLeft={isUnstakingDisabled ? 'info' : undefined}
                data-testid="@modal/staking/unstake-button"
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
