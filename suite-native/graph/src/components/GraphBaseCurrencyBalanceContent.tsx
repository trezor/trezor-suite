import { type Atom } from 'jotai';

import { type FiatGraphPoint } from '@suite-common/graph';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { GraphBaseCurrencyBalanceAmount } from './GraphBaseCurrencyBalanceAmount';
import { GraphBaseCurrencyBalanceChange } from './GraphBaseCurrencyBalanceChange';

type GraphBaseCurrencyBalanceContentProps<TGraphPoint extends FiatGraphPoint> = {
    points: TGraphPoint[];
    firstGraphPoint: TGraphPoint;
    selectedPointAtom: Atom<TGraphPoint | null>;
    isGestureActiveAtom: Atom<boolean>;
    showChange: boolean;
    totalBaseCurrencyBalance?: BaseCurrencyAmount;
};

const wrapperStyle = prepareNativeStyle(_ => ({
    height: 72,
    alignItems: 'center',
}));

export const GraphBaseCurrencyBalanceContent = <TGraphPoint extends FiatGraphPoint>({
    points,
    firstGraphPoint,
    selectedPointAtom,
    isGestureActiveAtom,
    showChange,
    totalBaseCurrencyBalance,
}: GraphBaseCurrencyBalanceContentProps<TGraphPoint>) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(wrapperStyle)}>
            <GraphBaseCurrencyBalanceAmount
                selectedPointAtom={selectedPointAtom}
                isGestureActiveAtom={isGestureActiveAtom}
                totalBaseCurrencyBalance={totalBaseCurrencyBalance}
            />
            {showChange && (
                <GraphBaseCurrencyBalanceChange
                    points={points}
                    firstGraphPoint={firstGraphPoint}
                    selectedPointAtom={selectedPointAtom}
                />
            )}
        </Box>
    );
};
