import { Atom, useAtom } from 'jotai';

import { HStack, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type PriceChangeIndicatorProps = {
    percentageChangeAtom: PercentageChangeAtom;
    hasPriceIncreasedAtom: HasPriceIncreasedAtom;
};

const getColorForPercentageChange = (hasIncreased: boolean) =>
    hasIncreased ? 'textPrimaryDefault' : 'textAlertRed';

type PercentageChangeAtom = Atom<number>;
type HasPriceIncreasedAtom = Atom<boolean>;

type PercentageChangeProps = {
    percentageChangeAtom: PercentageChangeAtom;
    hasPriceIncreasedAtom: HasPriceIncreasedAtom;
};

const PRICE_CHANGE_ICON_SIZE = 12;

const PercentageChange = ({
    percentageChangeAtom,
    hasPriceIncreasedAtom,
}: PercentageChangeProps) => {
    const [percentageChange] = useAtom(percentageChangeAtom);
    const [hasPriceIncreased] = useAtom(hasPriceIncreasedAtom);

    return (
        <Text color={getColorForPercentageChange(hasPriceIncreased)} variant="label">
            {percentageChange.toFixed(2)}%
        </Text>
    );
};

const PercentageChangeArrow = ({
    hasPriceIncreasedAtom,
}: {
    hasPriceIncreasedAtom: HasPriceIncreasedAtom;
}) => {
    const [hasPriceIncreased] = useAtom(hasPriceIncreasedAtom);

    const iconName: IconName = hasPriceIncreased ? 'caretUpFilled' : 'caretDownFilled';

    return (
        <Icon
            name={iconName}
            color={getColorForPercentageChange(hasPriceIncreased)}
            size={PRICE_CHANGE_ICON_SIZE}
        />
    );
};

const priceIncreaseWrapperStyle = prepareNativeStyle<{ hasPriceIncreased: boolean }>(
    (utils, { hasPriceIncreased }) => ({
        backgroundColor: hasPriceIncreased
            ? utils.colors.backgroundPrimarySubtleOnElevation0
            : utils.colors.backgroundAlertRedSubtleOnElevation0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: utils.spacings.sp8,
        paddingVertical: utils.spacings.sp2,
        borderRadius: utils.borders.radii.round,
    }),
);

export const PriceChangeIndicator = ({
    hasPriceIncreasedAtom,
    percentageChangeAtom,
}: PriceChangeIndicatorProps) => {
    const { applyStyle } = useNativeStyles();
    const [hasPriceIncreased] = useAtom(hasPriceIncreasedAtom);

    return (
        <HStack spacing="sp4" style={applyStyle(priceIncreaseWrapperStyle, { hasPriceIncreased })}>
            <PercentageChangeArrow hasPriceIncreasedAtom={hasPriceIncreasedAtom} />
            <PercentageChange
                hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                percentageChangeAtom={percentageChangeAtom}
            />
        </HStack>
    );
};
