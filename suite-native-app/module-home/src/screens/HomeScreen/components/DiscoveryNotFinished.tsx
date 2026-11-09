import { Card, PictogramTitleHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const cardStyle = prepareNativeStyle(utils => ({
    paddingTop: utils.spacings.sp32,
}));

export const DiscoveryNotFinished = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(cardStyle)}>
            <PictogramTitleHeader
                variant="warning"
                icon="plugsConnected"
                title={<Translation id="moduleHome.emptyState.discoveryNotFinished.title" />}
                subtitle={<Translation id="moduleHome.emptyState.discoveryNotFinished.subtitle" />}
            />
        </Card>
    );
};
