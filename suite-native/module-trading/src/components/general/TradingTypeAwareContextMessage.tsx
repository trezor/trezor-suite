import { useSelector } from 'react-redux';

import { Context } from '@suite-common/message-system';
import { ContextMessage, type ContextMessageProps } from '@suite-native/message-system';
import { selectActiveTradingType } from '@suite-native/trading-state';

export type TradingTypeAwareContextMessageProps = Omit<ContextMessageProps, 'context'>;

export const TradingTypeAwareContextMessage = (props: TradingTypeAwareContextMessageProps) => {
    const activeType = useSelector(selectActiveTradingType);

    if (!activeType) {
        return null;
    }

    return <ContextMessage context={Context.getTrading(activeType)} {...props} />;
};
