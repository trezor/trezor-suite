import type { Meta, StoryObj } from '@storybook/react-native';
import { action } from 'storybook/actions';

import { Box } from '../../Box';
import { Button } from '../../Button/Button';
import { BottomSheetModal as BottomSheetModalComponent } from '../../Sheet/BottomSheetModal';
import { useBottomSheetModal } from '../../Sheet/hooks/useBottomSheetModal';
import { VStack } from '../../Stack';
import { Text } from '../../Text';

type BottomSheetModalArgs = {
    title: string;
    subtitle: string;
    isCloseDisplayed: boolean;
    contentText: string;
    hasFooter: boolean;
    footerActionLabel: string;
};

type BottomSheetModalStory = StoryObj<BottomSheetModalArgs>;

const meta: Meta<BottomSheetModalArgs> = {
    title: 'Atoms',
    render: ({ contentText, hasFooter, footerActionLabel, ...bottomSheetModalProps }) => {
        const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

        return (
            <Box>
                <Button onPress={openModal}>Open Bottom Sheet</Button>
                <BottomSheetModalComponent
                    {...bottomSheetModalProps}
                    ref={bottomSheetRef}
                    onClose={action('onClose')}
                    onDismiss={action('onDismiss')}
                    footer={
                        hasFooter && (
                            <Box marginHorizontal="sp16" marginBottom="sp16">
                                <Button onPress={closeModal}>{footerActionLabel}</Button>
                            </Box>
                        )
                    }
                >
                    <VStack spacing="sp12" marginHorizontal="sp16">
                        <Text>{contentText}</Text>
                    </VStack>
                </BottomSheetModalComponent>
            </Box>
        );
    },
};

export default meta;

export const BottomSheetModal: BottomSheetModalStory = {
    name: 'BottomSheet',
    args: {
        title: 'Sheet title',
        subtitle: 'Optional subtitle',
        isCloseDisplayed: true,
        contentText: 'This is the content of the bottom sheet modal.',
        hasFooter: false,
        footerActionLabel: 'Footer Action',
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        subtitle: {
            control: { type: 'text' },
        },
        isCloseDisplayed: {
            control: { type: 'boolean' },
        },
        contentText: {
            control: { type: 'text' },
        },
        hasFooter: {
            control: { type: 'boolean' },
        },
        footerActionLabel: {
            control: { type: 'text' },
        },
    },
};
