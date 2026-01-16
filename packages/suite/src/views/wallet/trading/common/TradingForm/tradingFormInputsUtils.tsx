import { Translation } from '@suite/intl';
import { FractionButtonProps } from '@trezor/components';

import { TradingUseFormActionsReturnProps } from 'src/types/trading/tradingForm';

export const generateFractionButtons = (
    helpers: TradingUseFormActionsReturnProps,
): FractionButtonProps[] => [
    {
        id: 'TR_FRACTION_BUTTONS_10_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_10_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        onClick: () => helpers.setRatioAmount(10),
    },
    {
        id: 'TR_FRACTION_BUTTONS_25_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        onClick: () => helpers.setRatioAmount(4),
    },
    {
        id: 'TR_FRACTION_BUTTONS_50_PERCENT',
        children: <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />,
        isDisabled: helpers.isBalanceZero,
        onClick: () => helpers.setRatioAmount(2),
    },
    {
        id: 'TR_FRACTION_BUTTONS_MAX',
        children: <Translation id="TR_FRACTION_BUTTONS_MAX" />,
        onClick: () => helpers.setAllAmount(),
    },
];
