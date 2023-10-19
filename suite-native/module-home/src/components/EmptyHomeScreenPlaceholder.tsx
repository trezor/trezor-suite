import { useNavigation } from '@react-navigation/native';

import { Button, Card, Pictogram, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const cardStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: utils.spacings.extraLarge,
    padding: utils.spacings.extraLarge,
}));

export const EmptyHomeScreenPlaceholder = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const { translate } = useTranslate();

    const navigateToReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, {});
    };
    return (
        <Card style={applyStyle(cardStyle)}>
            <VStack spacing="large">
                <Pictogram
                    variant="green"
                    size="large"
                    icon="infoLight"
                    title={translate('moduleHome.placeholder.title')}
                    subtitle={translate('moduleHome.placeholder.subtitle')}
                />
                <Button iconLeft="receive" size="large" onPress={navigateToReceive}>
                    {translate('moduleHome.placeholder.receive')}
                </Button>
            </VStack>
        </Card>
    );
};
