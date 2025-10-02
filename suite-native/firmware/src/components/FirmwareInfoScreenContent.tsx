import React from 'react';

import { IconListTextItem, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const FirmwareInfoScreenContent = () => (
    <VStack spacing="sp24">
        <IconListTextItem icon="clock" textVariant="body" iconSize="large">
            <Translation id="firmware.firmwareInfoScreen.list.item1" />
        </IconListTextItem>
        <IconListTextItem icon="prohibit" textVariant="body" iconSize="large">
            <Translation
                id="firmware.firmwareInfoScreen.list.item2"
                values={{ b: chunks => <Text variant="highlight">{chunks}</Text> }}
            />
        </IconListTextItem>
        <IconListTextItem icon="check" textVariant="body" iconSize="large">
            <Translation
                id="firmware.firmwareInfoScreen.list.item3"
                values={{ b: chunks => <Text variant="highlight">{chunks}</Text> }}
            />
        </IconListTextItem>
    </VStack>
);
