import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import {
    TradingAvailabilityGuard,
    TradingContainer,
    TradingLayout,
    TradingSellFormWrapper,
} from '@trezor/suite';

export const TradingSellFormPage = () => {
    const type: TradingType = 'sell';

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            <TradingAvailabilityGuard type={type}>
                <TradingContainer>
                    <TradingSellFormWrapper />
                </TradingContainer>
            </TradingAvailabilityGuard>
        </TradingLayout>
    );
};
