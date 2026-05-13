import { StyleSheet, View } from 'react-native';

import { Badge, Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type FilterCountBadgeProps = {
    count: number;
};

const badgeWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    top: -4,
    right: -4,
}));

const badgeBackgroundStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.surfaceFillPage,
    ...StyleSheet.absoluteFillObject,
}));

export const FilterCountBadge = ({ count }: FilterCountBadgeProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={applyStyle(badgeWrapperStyle)}>
            <Box style={applyStyle(badgeBackgroundStyle)} />
            <Badge label={count} intent="brand" size="small" />
        </View>
    );
};
