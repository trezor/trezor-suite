import { TouchableOpacity } from 'react-native';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';
import React, { ReactNode } from 'react';
import { Box } from '../Box';
import { Text } from '../Text';

type Props = {
    onClose: () => void;
    children: ReactNode;
    title: string;
};

const modalWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray100,
    borderTopLeftRadius: utils.borders.radii.large,
    borderTopRightRadius: utils.borders.radii.large,
}));

const CLOSE_BUTTON_SIZE = 40;
const closeButtonStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray100,
    borderRadius: utils.borders.radii.round,
    height: CLOSE_BUTTON_SIZE,
    width: CLOSE_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const ModalBody = ({ onClose, title, children }: Props) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(modalWrapperStyle)}>
            <Box
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="md"
                paddingHorizontal="md"
            >
                <Text variant="titleSmall">{title}</Text>
                <TouchableOpacity onPress={onClose} style={applyStyle(closeButtonStyle)}>
                    <Icon name="close" />
                </TouchableOpacity>
            </Box>
            <Box paddingHorizontal="md">{children}</Box>
        </Box>
    );
};
