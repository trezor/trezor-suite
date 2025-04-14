import { Box, Text } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

export const WalletCreatedSuccessScreen = () => (
    <Screen isScrollable={false}>
        <Box justifyContent="center" alignItems="center" flex={1}>
            <Text color="textAlertRed" variant="titleMedium" textAlign="center">
                Wallet created successfully!{'\n'}TODO: implement next screen.
            </Text>
        </Box>
    </Screen>
);
