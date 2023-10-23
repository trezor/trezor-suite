import { TouchableOpacity } from 'react-native';

import { Box, Text, CheckBox } from '@suite-native/atoms';

export const DevCheckBoxListItem = ({
    title,
    onPress,
    isChecked,
}: {
    title: string;
    onPress: () => void;
    isChecked: boolean;
}) => (
    <TouchableOpacity onPress={onPress}>
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            paddingVertical="small"
        >
            <Text variant="body">{title}</Text>
            <CheckBox isChecked={isChecked} onChange={onPress} />
        </Box>
    </TouchableOpacity>
);
