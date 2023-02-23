import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text, Switch } from '@suite-native/atoms';

type TouchableSwitchRowProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    text: string;
};

export const TouchableSwitchRow = ({ isChecked, onChange, text }: TouchableSwitchRowProps) => (
    <TouchableOpacity onPress={() => onChange(!isChecked)}>
        <Box flexDirection="row" justifyContent="space-between" marginVertical="medium">
            <Text>{text}</Text>
            <Switch isChecked={isChecked} onChange={onChange} />
        </Box>
    </TouchableOpacity>
);
