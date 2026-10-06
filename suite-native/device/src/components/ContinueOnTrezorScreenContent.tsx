import { useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { type RequireAllOrNone } from 'type-fest';

import { selectDeviceModelWithFlagshipFallback } from '@suite-common/device';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ConnectorImage } from './ConnectorImage';
import { DeviceImage } from './DeviceImage';

type ContinueOnTrezorScreenContentProps = {
    titleTxKey?: TxKeyPath;
} & RequireAllOrNone<
    {
        actionLabelTxKey: TxKeyPath;
        onActionPress: () => void;
    },
    'actionLabelTxKey' | 'onActionPress'
>;

const DEVICE_IMAGE_MAX_HEIGHT_RATIO = 0.42;
const CONNECTOR_IMAGE_MAX_HEIGHT_RATIO = 0.18;

const titleStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp12,
    textAlign: 'center',
}));

const actionButtonStyle = prepareNativeStyle(() => ({
    alignSelf: 'center',
}));

export const ContinueOnTrezorScreenContent = ({
    titleTxKey = 'device.title.continueOnTrezor',
    actionLabelTxKey,
    onActionPress,
}: ContinueOnTrezorScreenContentProps) => {
    const { applyStyle } = useNativeStyles();
    const { height: windowHeight } = useWindowDimensions();

    const deviceModel = useSelector(selectDeviceModelWithFlagshipFallback);

    return (
        <VStack testID="@continue-on-trezor" flex={1} spacing="sp24">
            <Text variant="headline-md" style={applyStyle(titleStyle)}>
                <Translation id={titleTxKey} />
            </Text>
            {onActionPress && (
                <Button
                    size="medium"
                    intent="neutral"
                    priority="secondary"
                    style={applyStyle(actionButtonStyle)}
                    onPress={onActionPress}
                >
                    <Translation id={actionLabelTxKey} />
                </Button>
            )}
            <Box flex={1} alignItems="center" justifyContent="flex-end">
                <DeviceImage
                    deviceModel={deviceModel}
                    size="large"
                    maxHeight={windowHeight * DEVICE_IMAGE_MAX_HEIGHT_RATIO}
                />
                <ConnectorImage maxHeight={windowHeight * CONNECTOR_IMAGE_MAX_HEIGHT_RATIO} />
            </Box>
        </VStack>
    );
};
