import { useSelector } from 'react-redux';

import { RequireAllOrNone } from 'type-fest';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Box, Button, Text, VStack } from '@suite-native/atoms';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { DeviceModelInternal } from '@trezor/device-utils';
import { getScreenHeight } from '@trezor/env-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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

const SCREEN_HEIGHT = getScreenHeight();

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

    const deviceModel = useSelector(selectDeviceModel);

    return (
        <>
            <VStack spacing="sp24">
                <Text variant="titleMedium" style={applyStyle(titleStyle)}>
                    <Translation id={titleTxKey} />
                </Text>
                {onActionPress && (
                    <Button
                        size="small"
                        colorScheme="tertiaryElevation0"
                        style={applyStyle(actionButtonStyle)}
                        onPress={onActionPress}
                    >
                        <Translation id={actionLabelTxKey} />
                    </Button>
                )}
            </VStack>
            <Box flex={1} alignItems="center" justifyContent="flex-end">
                <DeviceImage
                    deviceModel={deviceModel || DeviceModelInternal.T3T1}
                    size="large"
                    maxHeight={0.42 * SCREEN_HEIGHT}
                />
                <ConnectorImage maxHeight={0.18 * SCREEN_HEIGHT} />
            </Box>
        </>
    );
};
