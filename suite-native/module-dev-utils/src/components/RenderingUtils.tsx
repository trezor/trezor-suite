import { TouchableOpacity } from 'react-native';

import { Box, Card, CheckBox, Text, useDebugView } from '@suite-native/atoms';

const DevCheckBoxListItem = ({
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

export const RenderingUtils = () => {
    const {
        toggleFlashOnRerender,
        toggleRerenderCount,
        isFlashOnRerenderEnabled,
        isRerenderCountEnabled,
    } = useDebugView();

    return (
        <Card>
            <DevCheckBoxListItem
                title="Flash on rerender"
                onPress={toggleFlashOnRerender}
                isChecked={isFlashOnRerenderEnabled}
            />
            <DevCheckBoxListItem
                title="Show rerender count"
                onPress={toggleRerenderCount}
                isChecked={isRerenderCountEnabled}
            />
        </Card>
    );
};
