import { ReactNode, Ref } from 'react';
import { useSelector } from 'react-redux';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import { BottomSheetModal, TextButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useSuiteSyncAlerts } from '@suite-native/suite-sync';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type EditableLabelLayoutParams = {
    children: (params: { onClose: () => void; ref: Ref<BottomSheetModalMethods> }) => ReactNode;
    label: string | null;
};

export const EditableLabelLayout = ({ children, label }: EditableLabelLayoutParams) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const { showSuiteSyncEnableConfirmationAlert } = useSuiteSyncAlerts();

    const isLabelingEnabled = useIsLabelingEnabled();

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
            <TextButton onPress={handleAddLabel} viewRight="pencil" testID="@labeling/addLabel">
                {label ?? <Translation id="labeling.addLabel" />}
            </TextButton>
            <BottomSheetModal
                ref={bottomSheetRef}
                title={<Translation id="labeling.label" />}
                onDismiss={closeModal}
                isCloseDisplayed={false}
            >
                {children({ ref: bottomSheetRef, onClose: closeModal })}
            </BottomSheetModal>
        </>
    );
};
