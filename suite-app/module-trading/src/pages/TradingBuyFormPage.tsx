import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import {
    TradingBuyFormWrapper,
    TradingContainer,
    TradingDisabled,
    TradingLayout,
    useMessageSystemTrading,
    useSelector,
} from '@trezor/suite';

export const TradingBuyFormPage = () => {
    const type: TradingType = 'buy';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingContainer>
                    <TradingBuyFormWrapper />
                </TradingContainer>
            )}
        </TradingLayout>
    );
};
