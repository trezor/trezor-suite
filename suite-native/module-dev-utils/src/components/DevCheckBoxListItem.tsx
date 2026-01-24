import { CheckBox, HStack, PressableOpacity, Text } from '@suite-native/atoms';

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
        <HStack justifyContent="space-between" alignItems="center">
            <Text variant="body">{title}</Text>
            <CheckBox isChecked={isChecked} onChange={onPress} />
        </HStack>
    </PressableOpacity>
);
