import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Icon, IconName } from '@trezor/icons/src';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles/src';
import { BottomSheet, Box, Button, Text } from '@suite-native/atoms/src';

type TransactionDetailSheetProps = {
    isVisible: boolean;
    iconName: IconName;
    onVisibilityChange: () => void;
    title: string;
    transactionId: string;
    children: ReactNode;
};

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

export const TransactionDetailSheet = ({
    isVisible,
    iconName,
    onVisibilityChange,
    title,
    transactionId,
    children,
}: TransactionDetailSheetProps) => (
    <>
        <BottomSheetTrigger iconName={iconName} title={title} onPress={onVisibilityChange} />

        <BottomSheet
            isVisible={isVisible}
            onClose={onVisibilityChange}
            title={title}
            subtitle={`Transaction #${transactionId}`}
        >
            <Box paddingTop="large">
                {children}
                <Box paddingHorizontal="small">
                    <Button size="large" onPress={onVisibilityChange} iconLeft="accounts">
                        Close
                    </Button>
                </Box>
            </Box>
        </BottomSheet>
    </>
);
