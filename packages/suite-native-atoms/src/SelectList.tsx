import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { Box } from './Box';
import { Icon } from '@trezor/icons';

type Props = {
    onClose: () => void;
    children: ReactNode;
};

export const SelectList = ({ onClose, children }: Props) => (
    <Box>
        <TouchableOpacity onPress={onClose}>
            <Icon name="closeCircle" />
        </TouchableOpacity>
        {children}
    </Box>
);
