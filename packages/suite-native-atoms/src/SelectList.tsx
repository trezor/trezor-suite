import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';
import { Box } from './Box';
import { Icon } from './Icon/Icon';

type Props = {
    onClose: () => void;
    children: ReactNode;
};

export const SelectList = ({ onClose, children }: Props) => (
    <Box>
        <TouchableOpacity onPress={onClose}>
            <Icon type="closeCircle" />
        </TouchableOpacity>
        {children}
    </Box>
);
