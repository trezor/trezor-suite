import { ReactNode, Ref } from 'react';
import { useSelector } from 'react-redux';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { useAlert } from '@suite-native/alerts';
import { BottomSheetModal, TextButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeServices } from '@suite-native/services';

import { selectIsLabelingEnabled } from '../selectors';

type EditableLabelLayoutParams = {
    children: (params: { onClose: () => void; ref: Ref<BottomSheetModalMethods> }) => ReactNode;
    label: string | null;
    testID?: string;
};

export const EditableLabelLayout = ({ children, label, testID }: EditableLabelLayoutParams) => {
    const { showAlert } = useAlert();
    const { suiteSync } = useNativeServices();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);

    const showSuiteSyncEnableConfirmationAlert = (onSuccess: () => void) => {
        showAlert({
            title: <Translation id="suiteSync.enableAlert.title" />,
            description: <Translation id="suiteSync.enableAlert.description" />,
            primaryButtonTitle: <Translation id="suiteSync.enableAlert.cta" />,
            onPressPrimaryButton: () => {
                suiteSync.turnOnSuiteSync();
                onSuccess();
            },
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const handleAddLabel = () => {
        if (!isSuiteSyncEnabled) {
            showSuiteSyncEnableConfirmationAlert(openModal);

            return;
        }

        openModal();
    };

    if (!isLabelingEnabled) {
        return null;
    }

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
