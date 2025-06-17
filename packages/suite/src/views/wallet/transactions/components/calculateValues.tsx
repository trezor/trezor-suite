import { isSameDay } from 'date-fns';
import { RawDataItem } from '../../../../components/suite/graph/TransactionsGraph/newGraph/types';
import { enhanceBalanceGraphDataForEachStep } from './useGraphData';
import { GraphRange } from '../../../../types/wallet/graph';

type CalculateValuesProps = {
    fiatRates: RawDataItem[];
    startBalance: number;
    currentRange: GraphRange;
    balanceGraphData: RawDataItem[];
};

export const getInvestmentChain = (
    fiatRates: RawDataItem[],
    balanceGraphData: RawDataItem[],
): { date: string; value: number; fiatRate?: number }[] =>
    balanceGraphData.map((item, index) => {
        const fiatRate = fiatRates.find(rate =>
            isSameDay(new Date(rate.date), new Date(item.date)),
        )?.value;

        if (index > 0) {
            const currentItem = item.value;
            const previousItem = balanceGraphData[index - 1].value;
            const diff = parseFloat((currentItem - previousItem).toFixed(8));

            return {
                date: item.date,
                value: diff,
                fiatRate,
            };
        }

        return {
            date: item.date,
            value: item.value,
            fiatRate,
        };
    });

export const calculateValues = ({
    fiatRates,
    startBalance,
    currentRange,
    balanceGraphData,
}: CalculateValuesProps) => {
    const balanceData = enhanceBalanceGraphDataForEachStep(
        startBalance,
        currentRange,
        balanceGraphData,
    );

    const investmentChain = getInvestmentChain(fiatRates, balanceGraphData);

    const data = fiatRates.reduce<RawDataItem[]>((acc, fiatRate, index) => {
        const investmentTimeslot = investmentChain.find(investment =>
            isSameDay(new Date(fiatRate.date), new Date(investment.date)),
        );
        const balanceValueForThisTimeslotIndex = balanceData.findIndex(balanceItem =>
            isSameDay(new Date(fiatRate.date), new Date(balanceItem.date)),
        );
        const balanceValueForThisTimeslot = balanceData[balanceValueForThisTimeslotIndex];
        const balanceValueForPreviousTimeslot =
            balanceValueForThisTimeslotIndex > 1
                ? balanceData[balanceValueForThisTimeslotIndex - 1]
                : null;

        const previousInvestment = acc[index - 1]?.fiatValueInvestment || 0;

        return [
            ...acc,
            {
                date: fiatRate.date,
                value: balanceValueForThisTimeslot ? balanceValueForThisTimeslot.value : 0,
                fiatValueInvestment:
                    investmentTimeslot?.fiatRate && balanceValueForPreviousTimeslot !== null
                        ? previousInvestment +
                          investmentTimeslot.fiatRate * investmentTimeslot.value
                        : previousInvestment,
                fiatValue: balanceValueForThisTimeslot
                    ? fiatRate.value * balanceValueForThisTimeslot.value
                    : 0,
            },
        ];
    }, []);

    return data;
};
