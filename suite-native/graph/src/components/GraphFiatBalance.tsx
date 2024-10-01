import { Atom, useAtomValue } from 'jotai';

import { FiatGraphPoint } from '@suite-common/graph';
import { Box, BoxSkeleton, DiscreetTextTrigger, HStack, VStack } from '@suite-native/atoms';
import { FiatBalanceFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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

const wrapperStyle = prepareNativeStyle(_ => ({
    height: 72, // Hardcoded because of some margin magic in FiatBalanceFormatter.
    alignItems: 'center',
}));

const Skeleton = () => {
    return (
        <VStack alignItems="center" spacing="sp8">
            <BoxSkeleton elevation="0" width={180} height={44} />
            <BoxSkeleton elevation="0" width={140} height={20} />
        </VStack>
    );
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
    const { applyStyle } = useNativeStyles();
    const firstGraphPoint = useAtomValue(referencePointAtom);

    if (!firstGraphPoint) {
        return <Skeleton />;
    }

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <Balance selectedPointAtom={selectedPointAtom} />
            <HStack alignItems="center">
                <GraphDateFormatter
                    firstPointDate={firstGraphPoint.date}
                    selectedPointAtom={selectedPointAtom}
                />
                <PriceChangeIndicator
                    hasPriceIncreasedAtom={hasPriceIncreasedAtom}
                    percentageChangeAtom={percentageChangeAtom}
                />
            </HStack>
        </Box>
    );
};
