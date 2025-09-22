import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    isTradingBuyContext,
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';

import { TradingBuyFormInputs } from './TradingBuyFormInputs';
import { TradingExchangeFormInputs } from './TradingExchangeFormInputs';
import { TradingSellFormInputs } from './TradingSellFormInputs';

export const TradingFormInputs = () => {
    const context = useTradingFormContext();

    if (isTradingBuyContext(context)) {
        return <TradingBuyFormInputs />;
    }

    if (isTradingSellContext(context)) {
        return <TradingSellFormInputs />;
    }

    if (isTradingExchangeContext(context)) {
        return <TradingExchangeFormInputs />;
    }

    return null;
};
