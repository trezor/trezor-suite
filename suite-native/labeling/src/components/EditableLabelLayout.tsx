import { ReactNode, Ref } from 'react';
import { useSelector } from 'react-redux';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { WithSuiteSyncAndDeviceState, selectSuiteSyncInteraction } from '@suite-common/suite-sync';
import { selectDeviceStaticSessionId } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { BottomSheetModal, TextButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

import { selectIsLabellingAllowed } from '../selectors';

type EditableLabelLayoutParams = {
    children: (params: { onClose: () => void; ref: Ref<BottomSheetModalMethods> }) => ReactNode;
    label: string | null;
    testID?: string;
};

export const EditableLabelLayout = ({ children, label, testID }: EditableLabelLayoutParams) => {
    const { showAlert } = useAlert();
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);

    const suiteSyncInteraction = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );

    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    const turnOnSuiteSync = async (onSuccess: () => void) => {
        if (!deviceStaticSessionId) return;

        const result = await suiteSync.turnOnSuiteSync({
            deviceStaticSessionId,
        });

        if (!result.success) {
            const { type } = result.error;
            switch (type) {
                case 'SuiteSyncUnavailableOnDeviceError':
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                case 'DeviceCancelled':
                case 'DeviceError':
                    showToast({ variant: 'error', icon: 'warning', message: type });

                            return;

                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    return;

                default:
                    return exhaustive(type);
                    }
                }

        onSuccess();
    };

    const showSuiteSyncEnableConfirmationAlert = (onSuccess: () => void) => {
        showAlert({
            title: <Translation id="suiteSync.enableAlert.title" />,
            description: <Translation id="suiteSync.enableAlert.description" />,
            primaryButtonTitle: <Translation id="suiteSync.enableAlert.cta" />,
            onPressPrimaryButton: () => turnOnSuiteSync(onSuccess),
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const handleAddLabel = async () => {
        switch (suiteSyncInteraction) {
            case 'suite-sync-off':
                showSuiteSyncEnableConfirmationAlert(openModal);
                break;
            case 'firmware-upgrade-needed':
                // TODO this will be handled in a follow-up
                showToast({
                    message: <Translation id="firmware.firmwareInfoScreen.title.update" />,
                    variant: 'warning',
                    icon: 'warning',
                });
                break;
            case 'keys-needed':
                if (deviceStaticSessionId) {
                    const result = await suiteSync.ensureWalletSuiteSyncOn({
                        deviceStaticSessionId,
                    });

                    if (result.success) {
                        openModal();
                    }
                }
                break;
            default:
                return;
        }
    };

    if (!isLabellingAllowed) return null;

    return (
        <>
            <TextButton onPress={handleAddLabel} viewRight="pencil" testID={testID}>
                {label ?? <Translation id="suiteSync.addLabel" />}
            </TextButton>
            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="suiteSync.label" />}
                onDismiss={closeModal}
                isCloseDisplayed={false}
            >
                {children({ ref: bottomSheetRef, onClose: closeModal })}
            </BottomSheetModal>
        </>
    );
};
