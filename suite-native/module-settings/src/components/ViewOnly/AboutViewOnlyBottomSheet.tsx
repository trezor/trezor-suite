import { BottomSheet, Button, TitleHeader, VStack, Text, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { OrderedListItem } from './OrderedListItem';

const HowItWorks = () => {
    let order = 1;

    return (
        <VStack>
            <Text variant="callout">
                <Translation id="moduleSettings.viewOnly.about.contentTitle" />
            </Text>
            <Box paddingLeft="sp8">
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
            </Box>
        </VStack>
    );
};

type AboutViewOnlyBottomSheetProps = {
    isVisible: boolean;
    onClose: () => void;
};

export const AboutViewOnlyBottomSheet = ({ isVisible, onClose }: AboutViewOnlyBottomSheetProps) => {
    if (!isVisible) {
        return null;
    }

    return (
        <BottomSheet isVisible={isVisible} onClose={onClose} isCloseDisplayed={false}>
            <VStack spacing="sp24" paddingHorizontal="sp8">
                <TitleHeader
                    title={<Translation id="moduleSettings.viewOnly.about.title" />}
                    subtitle={<Translation id="moduleSettings.viewOnly.about.subtitle" />}
                />
                <HowItWorks />
                <Button
                    colorScheme="primary"
                    testID="about-view-only-bottom-sheet-button"
                    onPress={onClose}
                >
                    <Translation id="generic.buttons.gotIt" />
                </Button>
            </VStack>
        </BottomSheet>
    );
};
