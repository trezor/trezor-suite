import { useSelector } from 'react-redux';

import { selectDeviceHasTradingTrades } from '@suite-common/trading';
import {
    TradingContainer,
    TradingTransactionsEmptyState,
    TradingTransactionsList,
} from '@trezor/suite';

export const TradingTransactionsPage = () => {
    const hasTrades = useSelector(selectDeviceHasTradingTrades);

    return (
        <TradingContainer>
            {hasTrades ? <TradingTransactionsList /> : <TradingTransactionsEmptyState />}
        </TradingContainer>
    );
};
