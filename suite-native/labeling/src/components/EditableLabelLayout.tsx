import { ReactNode, Ref } from 'react';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { BottomSheetModal, TextButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type EditableLabelLayoutParams = {
    children: (params: { onClose: () => void; ref: Ref<BottomSheetModalMethods> }) => ReactNode;
    label: string | null;
};

export const EditableLabelLayout = ({ children, label }: EditableLabelLayoutParams) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const isLabelingEnabled = useIsLabelingEnabled();

    if (!isLabelingEnabled) {
        return null;
    }

    return (
        <>
            <TextButton onPress={openModal} viewRight="pencil" testID="@labeling/addLabel">
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
