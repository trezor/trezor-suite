import { Card, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ReviewDestinationTagCardProps = {
    destinationTag: string;
};

const cardStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: utils.borders.widths.small,
    marginHorizontal: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp24,
    paddingVertical: utils.spacings.sp16,
    borderRadius: utils.borders.radii.r12,
    backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
    borderColor: utils.colors.borderElevation0,
}));

const destinationTagStyle = prepareNativeStyle(() => ({
    letterSpacing: 3,
}));

export const ReviewDestinationTagCard = ({ destinationTag }: ReviewDestinationTagCardProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Card style={applyStyle(cardStyle)}>
            <Text variant="titleSmall" style={applyStyle(destinationTagStyle)}>
                {destinationTag}
            </Text>
        </Card>
    );
};
