import { Atom, useAtomValue } from 'jotai';

import { FiatGraphPoint } from '@suite-common/graph';
import { BoxSkeleton, DiscreetTextTrigger, HStack } from '@suite-native/atoms';
import { FiatBalanceFormatter } from '@suite-native/formatters';

import { GraphDateFormatter } from './GraphDateFormatter';
import { PriceChangeIndicator } from './PriceChangeIndicator';

type BalanceProps = {
    selectedPointAtom: Atom<FiatGraphPoint>;
};

type GraphFiatBalanceProps = BalanceProps & {
    referencePointAtom: Atom<FiatGraphPoint | null>;
    percentageChangeAtom: Atom<number>;
    hasPriceIncreasedAtom: Atom<boolean>;
};

const Balance = ({ selectedPointAtom }: BalanceProps) => {
    const point = useAtomValue(selectedPointAtom);
    const fiatValue = String(point.value);

    return (
        <DiscreetTextTrigger>
            <FiatBalanceFormatter value={fiatValue} />
        </DiscreetTextTrigger>
    );
};

export const GraphFiatBalance = ({
    selectedPointAtom,
    referencePointAtom,
    percentageChangeAtom,
    hasPriceIncreasedAtom,
}: GraphFiatBalanceProps) => {
    const firstGraphPoint = useAtomValue(referencePointAtom);

    if (!firstGraphPoint) {
        return <BoxSkeleton width={120} height={73} />;
    }

    return (
        <>
            <Balance selectedPointAtom={selectedPointAtom} />
            <HStack alignItems="center" style={{ height: 24 }}>
                <GraphDateFormatter
                    firstPointDate={firstGraphPoint.date}
                    selectedPointAtom={selectedPointAtom}
                />
                <PriceChangeIndicator
                    hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                    percentageChangeAtom={percentageChangeAtom}
                />
            </HStack>
        </>
    );
};
