import React from 'react';
import { useSelector } from 'react-redux';

import { selectHasDeviceFirmwareInstalled } from '@suite-common/device';
import { IconListTextItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const FirmwareInfoScreenContent = () => {
    const hasDeviceFirmwareInstalled = useSelector(selectHasDeviceFirmwareInstalled);

    const item1TranslationId = hasDeviceFirmwareInstalled
        ? 'firmware.firmwareInfoScreen.list.item1.update'
        : 'firmware.firmwareInfoScreen.list.item1.install';

    const item3TranslationId = hasDeviceFirmwareInstalled
        ? 'firmware.firmwareInfoScreen.list.item3.update'
        : 'firmware.firmwareInfoScreen.list.item3.install';

    return (
        <VStack spacing="sp24">
            <IconListTextItem icon="clock" textVariant="body-md" iconSize="large">
                <Translation id={item1TranslationId} />
            </IconListTextItem>
            <IconListTextItem icon="prohibit" textVariant="body-md" iconSize="large">
                <Translation
                    id="firmware.firmwareInfoScreen.list.item2"
                    values={{ b: chunks => <Text variant="body-md-strong">{chunks}</Text> }}
                />
            </IconListTextItem>
            <IconListTextItem icon="check" textVariant="body-md" iconSize="large">
                <Translation
                    id={item3TranslationId}
                    values={{ b: chunks => <Text variant="body-md-strong">{chunks}</Text> }}
                />
            </IconListTextItem>
        </VStack>
    );
};
