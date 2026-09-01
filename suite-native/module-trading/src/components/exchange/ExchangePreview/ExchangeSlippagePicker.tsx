import type { ExchangeTrade } from 'invity-api';

import { SlippagePicker } from '@suite-native/trading-slippage';

import { useExchangeReceiveAmount } from '../../../hooks/exchange/useExchangeReceiveAmount';

type ExchangeSlippagePickerProps = {
    quote: ExchangeTrade | undefined;
    onSlippageConfirmed: () => Promise<void>;
};

export const ExchangeSlippagePicker = ({
    quote,
    onSlippageConfirmed,
}: ExchangeSlippagePickerProps) => {
    const { receiveAmount } = useExchangeReceiveAmount(quote);

    if (receiveAmount === undefined) {
        return null;
    }

    return (
        <SlippagePicker receiveAmount={receiveAmount} onSlippageConfirmed={onSlippageConfirmed} />
    );
};
