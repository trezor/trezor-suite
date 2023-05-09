import React from 'react';

import { Atom, useAtom } from 'jotai';

import { Box, Text } from '@suite-native/atoms';
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

const PercentageChange = ({
    percentageChangeAtom,
    hasPriceIncreasedAtom,
}: PercentageChangeProps) => {
    const [percentageChange] = useAtom(percentageChangeAtom);
    const [hasPriceIncreased] = useAtom(hasPriceIncreasedAtom);

    return (
        <Text color={getColorForPercentageChange(hasPriceIncreased)} variant="hint">
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
            size="extraSmall"
        />
    );
};

const arrowStyle = prepareNativeStyle(() => ({
    marginRight: 4,
}));

const priceIncreaseWrapperStyle = prepareNativeStyle<{ hasPriceIncreased: boolean }>(
    (utils, { hasPriceIncreased }) => ({
        backgroundColor: hasPriceIncreased
            ? utils.colors.backgroundPrimarySubtleOnElevation0
            : utils.colors.backgroundAlertRedSubtleOnElevation0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: utils.spacings.small,
        paddingVertical: utils.spacings.small / 4,
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
        <Box style={applyStyle(priceIncreaseWrapperStyle, { hasPriceIncreased })}>
            <Box style={applyStyle(arrowStyle)}>
                <PercentageChangeArrow hasPriceIncreasedAtom={hasPriceIncreasedAtom} />
            </Box>
            <PercentageChange
                hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                percentageChangeAtom={percentageChangeAtom}
            />
        </Box>
    );
};
