import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import {
    TradingAvailabilityGuard,
    TradingContainer,
    TradingExchangeFormWrapper,
    TradingLayout,
} from '@trezor/suite';

export const TradingExchangeFormPage = () => {
    const type: TradingType = 'exchange';

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            <TradingAvailabilityGuard type={type}>
                <TradingContainer>
                    <TradingExchangeFormWrapper />
                </TradingContainer>
            </TradingAvailabilityGuard>
        </TradingLayout>
    );
};
