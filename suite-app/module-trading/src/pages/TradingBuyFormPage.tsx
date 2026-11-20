import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import {
    TradingAvailabilityGuard,
    TradingBuyFormWrapper,
    TradingContainer,
    TradingLayout,
} from '@trezor/suite';

export const TradingBuyFormPage = () => {
    const type: TradingType = 'buy';

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            <TradingAvailabilityGuard type={type}>
                <TradingContainer>
                    <TradingBuyFormWrapper />
                </TradingContainer>
            </TradingAvailabilityGuard>
        </TradingLayout>
    );
};
