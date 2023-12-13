import { Card, Pictogram } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';

const cardStyle = prepareNativeStyle(utils => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: utils.spacings.extraLarge,
    padding: utils.spacings.extraLarge,
}));

export const EmptyConnectedDeviceState = () => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    return (
        <Card style={applyStyle(cardStyle)}>
            <Pictogram
                variant="green"
                size="large"
                icon="infoLight"
                title={translate('moduleHome.emptyState.device.title')}
                subtitle={translate('moduleHome.emptyState.device.subtitle')}
            />
        </Card>
    );
};
