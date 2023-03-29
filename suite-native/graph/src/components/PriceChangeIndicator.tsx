import React from 'react';

import { Atom, useAtomValue } from 'jotai';

import { Badge, BadgeVariant } from '@suite-native/atoms';
import { IconName } from '@trezor/icons';

type PriceChangeIndicatorProps = {
    percentageChangeAtom: PercentageChangeAtom;
    hasPriceIncreasedAtom: HasPriceIncreasedAtom;
};

type PercentageChangeAtom = Atom<number>;
type HasPriceIncreasedAtom = Atom<boolean>;

export const PriceChangeIndicator = ({
    hasPriceIncreasedAtom,
    percentageChangeAtom,
}: PriceChangeIndicatorProps) => {
    const percentageChange = useAtomValue(percentageChangeAtom);
    const hasPriceIncreased = useAtomValue(hasPriceIncreasedAtom);

    const icon: IconName = hasPriceIncreased ? 'arrowUp' : 'arrowDown';
    const badgeVariant: BadgeVariant = hasPriceIncreased ? 'green' : 'red';
    const percentageChangeLabel = `${percentageChange.toFixed(2)}%`;

    return (
        <Badge
            icon={icon}
            iconSize="extraSmall"
            variant={badgeVariant}
            label={percentageChangeLabel}
        />
    );
};
