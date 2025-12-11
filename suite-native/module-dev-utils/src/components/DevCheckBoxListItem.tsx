import { Box, CheckBox, PressableOpacity, Text } from '@suite-native/atoms';

export const DevCheckBoxListItem = ({
    title,
    onPress,
    isChecked,
}: {
    title: string;
    onPress: () => void;
    isChecked: boolean;
}) => (
    <PressableOpacity onPress={onPress}>
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            paddingVertical="sp8"
        >
            <Text variant="body">{title}</Text>
            <CheckBox isChecked={isChecked} onChange={onPress} />
        </Box>
    </PressableOpacity>
);
