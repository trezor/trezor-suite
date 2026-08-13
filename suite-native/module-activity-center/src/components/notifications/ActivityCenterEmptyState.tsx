import { Pictogram, Text, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type Props = {
    titleId: TxKeyPath;
    subtitleId: TxKeyPath;
};

//Exact value defined by Figma.
const TOP_PADDING = 94;

const wrapperStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    gap: utils.spacings.sp16,
    paddingTop: TOP_PADDING,
}));

export const ActivityCenterEmptyState = ({ titleId, subtitleId }: Props) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack style={applyStyle(wrapperStyle)}>
            <Pictogram variant="info" icon="bellZ" />
            <VStack spacing="sp4" alignItems="center">
                <Text variant="headline-md" textAlign="center">
                    <Translation id={titleId} />
                </Text>
                <Text variant="body-md" color="contentSecondary" textAlign="center">
                    <Translation id={subtitleId} />
                </Text>
            </VStack>
        </VStack>
    );
};
