import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import {
    TradingContainer,
    TradingDisabled,
    TradingExchangeFormWrapper,
    TradingLayout,
    useMessageSystemTrading,
    useSelector,
} from '@trezor/suite';

export const TradingExchangeFormPage = () => {
    const type: TradingType = 'exchange';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingContainer>
                    <TradingExchangeFormWrapper />
                </TradingContainer>
            )}
        </TradingLayout>
    );
};
