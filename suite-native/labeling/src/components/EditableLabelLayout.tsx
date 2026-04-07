import { type ReactNode, type Ref } from 'react';
import { Keyboard } from 'react-native';
import { useSelector } from 'react-redux';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { BottomSheetModal, TextButton, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useTurnOnSuiteSyncGuard } from '../hooks/useTurnOnSuiteSyncGuard';
import { selectIsLabellingAllowed } from '../selectors';

type EditableLabelLayoutParams = {
    children: (params: { onClose: () => void; ref: Ref<BottomSheetModalMethods> }) => ReactNode;
    label: string | null;
    testID?: string;
};

export const EditableLabelLayout = ({ children, label, testID }: EditableLabelLayoutParams) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const { handleAddLabel } = useTurnOnSuiteSyncGuard();

    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    if (!isLabellingAllowed) return null;

    const handlePress = () => {
        Keyboard.dismiss();
        handleAddLabel(openModal);
    };

    return (
        <>
            <TextButton onPress={handlePress} viewRight="pencil" testID={testID}>
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
