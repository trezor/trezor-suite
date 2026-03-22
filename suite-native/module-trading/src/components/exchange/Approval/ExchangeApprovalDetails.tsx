import { useSelector } from 'react-redux';

import { Card } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { LimitPicker } from './LimitPicker';
import { FeePicker } from '../../fees/FeePicker';
import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';

type ExchangeApprovalDetailsProps = {
    fee: string | undefined;
    isLoading: boolean;
    exchange: string | undefined;
};

const noop = () => {};

export const ExchangeApprovalDetails = ({
    fee,
    isLoading,
    exchange,
}: ExchangeApprovalDetailsProps) => {
    const account = useSelector(selectExchangeSelectedSendAccount);

    if (!account) {
        return null;
    }

    return (
        <>
            <NetworkAndAccountCard
                account={account}
                title={<Translation id="moduleTrading.exchangeTradePreviewCard.account" />}
            >
                <ProviderInfoRow exchange={exchange} />
                <LimitPicker />
            </NetworkAndAccountCard>

            <Card noPadding>
                <FeePicker
                    fee={fee ?? '0'}
                    symbol={account.symbol}
                    onPress={noop}
                    isLoading={isLoading}
                />
            </Card>
        </>
    );
};
