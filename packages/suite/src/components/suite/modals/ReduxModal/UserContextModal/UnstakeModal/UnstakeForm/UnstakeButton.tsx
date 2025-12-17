import { EventType } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectAreFeesLoading, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import type { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Modal, Tooltip } from '@trezor/components';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';
import { useUnstakeFormContext } from 'src/hooks/wallet/useUnstakeForm';
import { useLegacyAnalytics } from 'src/support/useAnalytics';
import { CRYPTO_INPUT, FIAT_INPUT } from 'src/types/wallet/stakeForms';

export const UnstakeButton = () => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const selectedAccount = useSelector(
        state => state.wallet.selectedAccount,
    ) as SelectedAccountLoaded;
    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking(
        selectedAccount.network.symbol,
    );

    const {
        isComposing,
        formState: { isSubmitting, errors },
        handleSubmit,
        watch,
        signTx,
        currency,
    } = useUnstakeFormContext();
    const legacyAnalytics = useLegacyAnalytics();
    const hasValues = Boolean(watch(FIAT_INPUT) || watch(CRYPTO_INPUT));
    // used instead of formState.isValid, which is sometimes returning false even if there are no errors
    const formIsValid = Object.keys(errors).length === 0;

    const isDeviceConnected = device?.connected && device?.available;

    const isDisabled =
        !(formIsValid && hasValues) || isSubmitting || (isDeviceConnected && isLocked());
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const areFeesLoading = useSelector(state =>
        selectAreFeesLoading(state, selectedAccount.network.symbol),
    );

    const onUnstakeClick = () => {
        if (!isDeviceConnected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }

        handleSubmit(signTx)();

        legacyAnalytics.report({
            type: EventType.StakingUnstake,
            payload: {
                action: 'continue',
                step: 'unstake-form-modal',
                currency,
                networkSymbol: selectedAccount.account.symbol,
            },
        });
    };

    const isLoading = isComposing || isSubmitting || isDiscoveryRunning || areFeesLoading;

    return (
        <Tooltip content={unstakingMessageContent}>
            <Modal.Button
                isDisabled={isDisabled || isUnstakingDisabled}
                isLoading={isLoading}
                onClick={onUnstakeClick}
                iconLeft={isUnstakingDisabled ? 'info' : undefined}
                data-testid="@modal/staking/unstake-button"
            >
                <Translation id="TR_CONTINUE" />
            </Modal.Button>
        </Tooltip>
    );
};
