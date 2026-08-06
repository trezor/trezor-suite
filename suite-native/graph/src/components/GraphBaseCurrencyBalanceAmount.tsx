import { type Atom, useAtomValue } from 'jotai';

import { type FiatGraphPoint } from '@suite-common/graph';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { DiscreetTextTrigger } from '@suite-native/atoms';
import { BaseCurrencyAmountLargeFormatter } from '@suite-native/formatters';
import { BigNumber } from '@trezor/utils';

export type GraphBaseCurrencyBalanceAmountProps<TGraphPoint extends FiatGraphPoint> = {
    selectedPointAtom: Atom<TGraphPoint | null>;
    isGestureActiveAtom: Atom<boolean>;
    totalBaseCurrencyBalance?: BaseCurrencyAmount;
};

const FormattedBalance = ({ value }: { value: BaseCurrencyAmount }) => (
    <DiscreetTextTrigger testID="@home/portfolio/fiat-balance-header/discreet-trigger">
        <BaseCurrencyAmountLargeFormatter
            value={value}
            testID="@home/portfolio/fiat-balance-header"
        />
    </DiscreetTextTrigger>
);

const SelectedPointFiatBalance = <TGraphPoint extends FiatGraphPoint>({
    selectedPointAtom,
}: Pick<GraphBaseCurrencyBalanceAmountProps<TGraphPoint>, 'selectedPointAtom'>) => {
    const selectedPoint = useAtomValue(selectedPointAtom);
    const selectedPointFiatValue = String(selectedPoint?.value ?? 0);
    const selectedPointFiatBalance = asBaseCurrencyAmount(new BigNumber(selectedPointFiatValue));

    return <FormattedBalance value={selectedPointFiatBalance} />;
};

export const GraphBaseCurrencyBalanceAmount = <TGraphPoint extends FiatGraphPoint>({
    selectedPointAtom,
    isGestureActiveAtom,
    totalBaseCurrencyBalance,
}: GraphBaseCurrencyBalanceAmountProps<TGraphPoint>) => {
    const isGestureActive = useAtomValue(isGestureActiveAtom);

    // While the user is not swiping the graph, the live total balance is displayed, because
    // the last graph point is frozen at fetch time and its value goes stale as rates move.
    if (!isGestureActive && totalBaseCurrencyBalance !== undefined) {
        return <FormattedBalance value={totalBaseCurrencyBalance} />;
    }

    return <SelectedPointFiatBalance selectedPointAtom={selectedPointAtom} />;
};
