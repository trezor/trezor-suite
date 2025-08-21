import { ReactNode, Ref } from 'react';
import { FlexStyle } from 'react-native';

import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { BottomSheetModal, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { AddLabelButtonText } from './AddLabelButtonText';

type EditableLabelLayoutParams = {
    children: (params: { onClose: () => void; ref: Ref<BottomSheetModalMethods> }) => ReactNode;
    label: string | null;
    justifyContent?: FlexStyle['justifyContent'];
};

export const EditableLabelLayout = ({
    children,
    label,
    justifyContent,
}: EditableLabelLayoutParams) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <AddLabelButtonText onPress={openModal} justifyContent={justifyContent} label={label} />
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
