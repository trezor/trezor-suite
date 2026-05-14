import { Translation } from '@suite/intl';
import { type FractionButtonProps } from '@trezor/components';

import { type TradingUseFormActionsReturnProps } from 'src/types/trading/tradingForm';

export type FormPercentButtonValue = '10%' | '25%' | '50%' | 'max';

export type FractionButtonWithPercentValue = FractionButtonProps & {
    percentValue: FormPercentButtonValue;
};

export const generateFractionButtons = (
    helpers: TradingUseFormActionsReturnProps,
): FractionButtonWithPercentValue[] => [
    {
        id: 'TR_FRACTION_BUTTONS_10_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_10_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        percentValue: '10%',
        onClick: () => helpers.setRatioAmount(10),
    },
    {
        id: 'TR_FRACTION_BUTTONS_25_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        percentValue: '25%',
        onClick: () => helpers.setRatioAmount(4),
    },
    {
        id: 'TR_FRACTION_BUTTONS_50_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        percentValue: '50%',
        onClick: () => helpers.setRatioAmount(2),
    },
    {
        id: 'TR_FRACTION_BUTTONS_MAX',
        children: <Translation id="TR_FRACTION_BUTTONS_MAX" />,
        percentValue: 'max',
        onClick: () => helpers.setAllAmount(),
    },
];
