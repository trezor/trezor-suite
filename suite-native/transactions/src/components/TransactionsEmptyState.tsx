import { useNavigation } from '@react-navigation/native';

import { Box, Button, Card, PictogramTitleHeader } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';

const wrapperStyle = prepareNativeStyle(() => ({
    paddingHorizontal: 0,
}));

const cardStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    flex: 1,
    width: '100%',
    paddingHorizontal: utils.spacings.sp24,
    paddingVertical: utils.spacings.sp32,
    borderRadius: utils.borders.radii.r20,
}));

const receiveButtonStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const TransactionsEmptyState = ({ accountKey }: { accountKey: string }) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();
    const { applyStyle } = useNativeStyles();

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { accountKey, closeActionType: 'back' });
    };

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Card style={applyStyle(cardStyle)}>
                <Box marginBottom="sp24" alignItems="center">
                    <PictogramTitleHeader
                        variant="green"
                        icon="stack"
                        title={<Translation id="transactions.emptyState.title" />}
                        subtitle={<Translation id="transactions.emptyState.subtitle" />}
                    />
                </Box>
                <Box style={applyStyle(receiveButtonStyle)}>
                    <Button viewLeft="receive" onPress={handleReceive} size="large">
                        <Translation id="transactions.emptyState.button" />
                    </Button>
                </Box>
            </Card>
        </Box>
    );
};
