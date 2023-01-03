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

export const TransactionDetailSheets = () => {
    const [isParametersSheetExpanded, setIsParametersSheetExpanded] = useState(false);
    const [isValuesSheetExpanded, setIsValuesSheetExpanded] = useState(false);
    const [isInputsSheetExpanded, setIsInputsSheetExpanded] = useState(false);

    return (
        <Card>
            <VStack spacing="small">
                <BottomSheetTrigger
                    iconName="warningCircle"
                    title="Parameters"
                    onPress={() => setIsParametersSheetExpanded(true)}
                />
                <BottomSheetTrigger
                    iconName="close"
                    title="Current values"
                    onPress={() => setIsValuesSheetExpanded(true)}
                />
                <BottomSheetTrigger
                    iconName="close"
                    title="Inputs & Outputs"
                    onPress={() => setIsInputsSheetExpanded(true)}
                />
            </VStack>

            <BottomSheet
                isVisible={isParametersSheetExpanded}
                onVisibilityChange={() => setIsParametersSheetExpanded(!isParametersSheetExpanded)}
            >
                <Text>Parameters</Text>
            </BottomSheet>
            <BottomSheet
                isVisible={isValuesSheetExpanded}
                onVisibilityChange={() => setIsValuesSheetExpanded(!isValuesSheetExpanded)}
            >
                <Text>Current values</Text>
            </BottomSheet>
            <BottomSheet
                isVisible={isInputsSheetExpanded}
                onVisibilityChange={() => setIsInputsSheetExpanded(!isInputsSheetExpanded)}
            >
                <Text>Inputs & Outputs</Text>
            </BottomSheet>
        </Card>
    );
};
