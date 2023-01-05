import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { BottomSheet, Box, Card, Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@trezor/icons';

const triggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: utils.spacings.small,
}));

const BottomSheetTrigger = ({
    iconName,
    title,
    onPress,
}: {
    iconName: IconName;
    title: string;
    onPress: () => void;
}) => {
    const { applyStyle } = useNativeStyles();
    return (
        <TouchableOpacity style={applyStyle(triggerStyle)} onPress={onPress}>
            <Box flexDirection="row">
                <Box marginRight="medium">
                    <Icon name={iconName} color="forest" />
                </Box>
                <Text>{title}</Text>
            </Box>
            <Icon name="chevronRight" />
        </TouchableOpacity>
    );
};

type SheetType = 'parameters' | 'values' | 'inputs';

export const TransactionDetailSheets = () => {
    const [expandedSheet, setExpandedSheet] = useState<SheetType | null>(null);

    const handleCloseExpandedSheet = () => setExpandedSheet(null);

    return (
        <Card>
            <VStack spacing="small">
                <BottomSheetTrigger
                    iconName="warningCircle"
                    title="Parameters"
                    onPress={() => setExpandedSheet('parameters')}
                />
                <BottomSheetTrigger
                    iconName="clockClockwise"
                    title="Current values"
                    onPress={() => setExpandedSheet('values')}
                />
                <BottomSheetTrigger
                    iconName="swap"
                    title="Inputs & Outputs"
                    onPress={() => setExpandedSheet('inputs')}
                />
            </VStack>

            <BottomSheet
                isVisible={expandedSheet === 'parameters'}
                onVisibilityChange={handleCloseExpandedSheet}
            >
                <Text>Parameters</Text>
            </BottomSheet>
            <BottomSheet
                isVisible={expandedSheet === 'values'}
                onVisibilityChange={handleCloseExpandedSheet}
            >
                <Text>Current values</Text>
            </BottomSheet>
            <BottomSheet
                isVisible={expandedSheet === 'inputs'}
                onVisibilityChange={handleCloseExpandedSheet}
            >
                <Text>Inputs & Outputs</Text>
            </BottomSheet>
        </Card>
    );
};
