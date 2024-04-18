import {
    BottomSheet,
    Box,
    Button,
    TitleHeader,
    VStack,
    Text,
    OrderedListItem,
} from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Translation } from '@suite-native/intl';

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.medium,
}));

type AboutViewOnlyBottomSheetProps = {
    isVisible: boolean;
    onClose: () => void;
};

export const AboutViewOnlyBottomSheet = ({ isVisible, onClose }: AboutViewOnlyBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    let order = 1;

    if (!isVisible) {
        return null;
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} isCloseDisplayed={false}>
            <VStack spacing="large" paddingHorizontal="small">
                <TitleHeader
                    title={<Translation id="moduleSettings.viewOnly.about.title" />}
                    subtitle={<Translation id="moduleSettings.viewOnly.about.subtitle" />}
                />
                <VStack>
                    <Text variant="callout">
                        <Translation id="moduleSettings.viewOnly.about.contentTitle" />
                    </Text>
                    <VStack spacing={0}>
                        <Translation
                            id="moduleSettings.viewOnly.about.content"
                            values={{
                                li: chunk => {
                                    const index = order;
                                    order += 1;

                                    return (
                                        <OrderedListItem
                                            key={`${chunk}`}
                                            order={index}
                                            variant="body"
                                            color="textSubdued"
                                        >
                                            {chunk}
                                        </OrderedListItem>
                                    );
                                },
                            }}
                        />
                    </VStack>
                </VStack>
                <Box style={applyStyle(buttonWrapperStyle)}>
                    <Button
                        colorScheme="primary"
                        testID="about-view-only-bottom-sheet-button"
                        onPress={onClose}
                    >
                        <Translation id="moduleSettings.viewOnly.about.button" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
