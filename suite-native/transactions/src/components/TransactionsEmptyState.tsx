import { useNavigation } from '@react-navigation/native';

import { Box, Button, Card, Pictogram } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

const cardStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    paddingHorizontal: utils.spacings.large,
    borderRadius: utils.borders.radii.large,
}));

const receiveButtonStyle = prepareNativeStyle(() => ({
    width: '90%',
}));

export const TransactionsEmptyState = ({ accountKey }: { accountKey: string }) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();
    const { applyStyle } = useNativeStyles();

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { accountKey });
    };

    return (
        <Box paddingHorizontal="m">
            <Card style={applyStyle(cardStyle)}>
                <Box marginBottom="large" alignItems="center">
                    <Pictogram
                        variant="green"
                        icon="stack"
                        title="No transactions"
                        subtitle="Get started by receiving coins"
                    />
                </Box>
                <Box style={applyStyle(receiveButtonStyle)}>
                    <Button iconLeft="receive" onPress={handleReceive}>
                        Receive
                    </Button>
                </Box>
            </Card>
        </Box>
    );
};
