import { Atom, useAtom } from 'jotai';

import { PriceChangeBadge } from '@suite-native/atoms';

type PercentageChangeAtom = Atom<number>;

type PriceChangeIndicatorProps = {
    percentageChangeAtom: PercentageChangeAtom;
};

export const PriceChangeIndicator = ({ percentageChangeAtom }: PriceChangeIndicatorProps) => {
    const [percentageChange] = useAtom(percentageChangeAtom);

    return <PriceChangeBadge valuePercentageChange={percentageChange} />;
};
