import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import {
    TradingContainer,
    TradingDisabled,
    TradingLayout,
    TradingSellFormWrapper,
    useMessageSystemTrading,
    useSelector,
} from '@trezor/suite';

export const TradingSellFormPage = () => {
    const type: TradingType = 'sell';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingContainer>
                    <TradingSellFormWrapper />
                </TradingContainer>
            )}
        </TradingLayout>
    );
};
