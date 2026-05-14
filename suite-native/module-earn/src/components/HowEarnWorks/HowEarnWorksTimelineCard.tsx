import { type ReactNode } from 'react';

import {
    BottomSheetModal,
    Card,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const timelineCardPressableStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type HowEarnWorksTimelineCardProps = {
    cardTitle: ReactNode;
    bottomSheetTitle: ReactNode;
    children: ReactNode;
};

export const HowEarnWorksTimelineCard = ({
    cardTitle,
    bottomSheetTitle,
    children,
}: HowEarnWorksTimelineCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <PressableOpacity style={applyStyle(timelineCardPressableStyle)} onPress={openModal}>
                <Card borderColor="borderNeutral" noShadow>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text variant="body-md-strong">{cardTitle}</Text>
                        <Icon name="caretDown" color="contentPrimary" />
                    </HStack>
                </Card>
            </PressableOpacity>

            <BottomSheetModal
                ref={bottomSheetRef}
                title={bottomSheetTitle}
                isCloseDisplayed
                onClose={closeModal}
            >
                <VStack spacing="sp24">{children}</VStack>
            </BottomSheetModal>
        </>
    );
};
