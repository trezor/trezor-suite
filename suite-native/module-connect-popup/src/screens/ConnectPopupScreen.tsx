import { Box, Button, Text } from '@suite-native/atoms';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import * as Linking from 'expo-linking';

export const ConnectPopupScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.TransactionDetail>) => {
    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    closeActionType="close"
                    content={<Text>Connect Popup Native</Text>}
                />
            }
        >
            <Box alignItems="center" justifyContent="center" flex={1}>
                <Text>{JSON.stringify(route.params)}</Text>
                <Button
                    onPress={() => {
                        Linking.openURL(
                            `trezorsuitelite://send?coin=btc&address=1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2&amount=${Math.random()}`,
                        );
                    }}
                >
                    Open URL in this app
                </Button>
            </Box>
        </Screen>
    );
};
