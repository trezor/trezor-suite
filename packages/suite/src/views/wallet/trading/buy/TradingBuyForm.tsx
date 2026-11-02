import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingBuyFormWrapper } from 'src/views/wallet/trading/buy/TradingBuyFormWrapper';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';

export const TradingBuyForm = () => {
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
