import { ReactNode, Ref } from 'react';
import { FlexStyle, Pressable } from 'react-native';

import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { BottomSheetModal, HStack, Text, useBottomSheetModal } from '@suite-native/atoms';
import { Icon, iconSizes } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

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
            <Pressable onPress={openModal}>
                <HStack spacing="sp8" justifyContent={justifyContent}>
                    <Text textAlign="center" color="textPrimaryDefault" testID="@receive/addLabel">
                        {label ?? <Translation id="labeling.addLabel" />}
                    </Text>
                    <Icon name="pencil" color="textPrimaryDefault" size={iconSizes.mediumLarge} />
                </HStack>
            </Pressable>
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
