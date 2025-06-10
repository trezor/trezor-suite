import { useSelector } from 'react-redux';

import { Context, ContextDomain } from '@suite-common/message-system';
import { ContextMessage, ContextMessageProps } from '@suite-native/message-system';
import { exhaustive } from '@trezor/type-utils';

import { selectActiveTradingType } from '../../selectors/commonSelectors';

export type TradingTypeAwareContextMessageProps = Omit<ContextMessageProps, 'context'>;

const useTradingTypeAwareContext = (): ContextDomain | undefined => {
    const activeType = useSelector(selectActiveTradingType);

    switch (activeType) {
        case 'buy':
            return Context.tradingBuy;

        case 'exchange':
            return Context.tradingExchange;

        case 'sell':
            return Context.tradingSell;

        case undefined:
            return undefined;

        default:
            return exhaustive(activeType);
    }
};

export const TradingTypeAwareContextMessage = (props: TradingTypeAwareContextMessageProps) => {
    const context = useTradingTypeAwareContext();

    if (!context) {
        return null;
    }

    return <ContextMessage context={context} {...props} />;
};
