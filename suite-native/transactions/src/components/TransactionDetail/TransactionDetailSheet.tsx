import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Icon, IconName } from '@suite-common/icons-deprecated';
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

const triggerStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
            <Box flexDirection="row" alignItems="center">
                <Box marginRight="sp16">
                    <Icon name={iconName} color="iconDefault" size="mediumLarge" />
                </Box>
                <Text>{title}</Text>
            </Box>
            <Icon name="chevronRight" color="iconSubdued" size="mediumLarge" />
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
            <Box paddingTop="sp24">
                {children}
                <Box paddingHorizontal="sp8" marginTop="sp24">
                    <Button size="large" onPress={onVisibilityChange}>
                        Close
                    </Button>
                </Box>
            </Box>
        </BottomSheet>
    </>
);
