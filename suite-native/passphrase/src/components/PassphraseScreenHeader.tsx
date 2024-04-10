import { useNavigation } from '@react-navigation/native';

import { Box, IconButton, ScreenHeaderWrapper } from '@suite-native/atoms';

export const PassphraseScreenHeader = () => {
    const navigation = useNavigation();

    return (
        <ScreenHeaderWrapper>
            <Box>
                <IconButton
                    iconName="close"
                    size="medium"
                    colorScheme="tertiaryElevation1"
                    accessibilityRole="button"
                    accessibilityLabel="close"
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();
                        }
                    }}
                />
            </Box>
        </ScreenHeaderWrapper>
    );
};
