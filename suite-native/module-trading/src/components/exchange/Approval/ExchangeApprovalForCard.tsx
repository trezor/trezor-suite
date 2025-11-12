import { useSelector } from 'react-redux';

import { Translation } from '@suite-native/intl';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

export const ExchangeApprovalForCard = () => {
    const account = useSelector(selectExchangeSelectedSendAccount);

    if (!account) {
        return null;
    }

    return (
        <NetworkAndAccountCard
            accountLabel={account.accountLabel}
            symbol={account.symbol}
            title={<Translation id="moduleTrading.tradingExchangeApprovalScreen.for" />}
        />
    );
};
