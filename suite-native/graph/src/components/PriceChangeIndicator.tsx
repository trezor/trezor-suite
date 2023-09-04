import { Atom, useAtom } from 'jotai';

import { HStack, Text } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-common/icons';
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

const PRICE_CHANGE_ICON_SIZE = 6;

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

    const iconName: IconName = hasPriceIncreased ? 'arrowUp' : 'arrowDown';

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
        paddingHorizontal: utils.spacings.small,
        paddingVertical: utils.spacings.extraSmall / 2,
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
        <HStack
            spacing={PRICE_CHANGE_ICON_SIZE}
            style={applyStyle(priceIncreaseWrapperStyle, { hasPriceIncreased })}
        >
            <PercentageChangeArrow hasPriceIncreasedAtom={hasPriceIncreasedAtom} />
            <PercentageChange
                hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                percentageChangeAtom={percentageChangeAtom}
            />
        </HStack>
    );
};
