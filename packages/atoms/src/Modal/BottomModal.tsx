import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Text } from '../Text';
import { Icon } from '../Icon/Icon';
import { BottomModalContainer } from './BottomModalContainer';

type BottomModalProps = {
    isVisible: boolean;
    onVisibilityChange: (isVisible: boolean) => void;
    children: ReactNode;
    title: string;
    hasBackArrow?: boolean;
    onBackArrowClick?: () => void;
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

const modalHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.md,
    paddingVertical: utils.spacings.md,
}));

export const BottomModal = ({
    isVisible,
    onVisibilityChange,
    title,
    onBackArrowClick,
    children,
    hasBackArrow = false,
}: BottomModalProps) => {
    const { applyStyle } = useNativeStyles();

    const handleCloseModal = () => onVisibilityChange(false);

    return (
        <BottomModalContainer isVisible={isVisible} onClose={handleCloseModal}>
            <Box style={applyStyle(modalWrapperStyle)}>
                <Box style={applyStyle(modalHeaderStyle)}>
                    {hasBackArrow && (
                        <TouchableOpacity onPress={onBackArrowClick}>
                            <Icon type="chevronLeft" />
                        </TouchableOpacity>
                    )}
                    <Text variant="titleSmall">{title}</Text>
                    <TouchableOpacity
                        onPress={handleCloseModal}
                        style={applyStyle(closeButtonStyle)}
                    >
                        <Icon type="close" />
                    </TouchableOpacity>
                </Box>
                <Box paddingHorizontal="md">{children}</Box>
            </Box>
        </BottomModalContainer>
    );
};
