import { CheckBox, DecorativeControl, HStack, PressableOpacity, Text } from '@suite-native/atoms';

export const DevCheckBoxListItem = ({
    title,
    onPress,
    isChecked,
}: {
    title: string;
    onPress: () => void;
    isChecked: boolean;
}) => (
    <PressableOpacity
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
        accessibilityLabel={title}
    >
        <HStack justifyContent="space-between" alignItems="center">
            <Text variant="body-md">{title}</Text>
            <DecorativeControl>
                <CheckBox isChecked={isChecked} onChange={onPress} />
            </DecorativeControl>
        </HStack>
    </PressableOpacity>
);
