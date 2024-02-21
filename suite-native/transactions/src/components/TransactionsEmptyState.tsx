import { useNavigation } from '@react-navigation/native';

import { Box, Button, Card, Pictogram } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Translation, useTranslate } from '@suite-native/intl';

const wrapperStyle = prepareNativeStyle(() => ({
    paddingHorizontal: 0,
}));

const cardStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    flex: 1,
    width: '100%',
    paddingHorizontal: utils.spacings.large,
    paddingVertical: utils.spacings.extraLarge,
    borderRadius: utils.borders.radii.large,
}));

const receiveButtonStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

export const TransactionsEmptyState = ({ accountKey }: { accountKey: string }) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.ReceiveModal>>();
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { accountKey });
    };

    return (
        <Box paddingHorizontal="medium" style={applyStyle(wrapperStyle)}>
            <Card style={applyStyle(cardStyle)}>
                <Box marginBottom="large" alignItems="center">
                    <Pictogram
                        variant="green"
                        icon="stack"
                        title={<Translation id="transactions.emptyState.title" />}
                        subtitle={translate('transactions.emptyState.subtitle')}
                    />
                </Box>
                <Box style={applyStyle(receiveButtonStyle)}>
                    <Button iconLeft="receive" onPress={handleReceive} size="large">
                        {translate('transactions.emptyState.button')}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
};
