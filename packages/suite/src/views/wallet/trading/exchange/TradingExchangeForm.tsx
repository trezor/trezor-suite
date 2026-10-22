import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';
import { TradingExchangeFormWrapper } from 'src/views/wallet/trading/exchange/TradingExchangeFormWrapper';

import { TradingDisabled } from '../common/TradingDisabled';

export const TradingExchangeForm = () => {
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
