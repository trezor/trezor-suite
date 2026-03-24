import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Card, InlineAlertBox } from '@suite-native/atoms';
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

    useEffect(() => {
        if (!account) {
            console.error('No account selected for exchange approval details');
        }
    }, [account]);

    if (!account) {
        return (
            <InlineAlertBox
                title={
                    <Translation id="moduleTrading.tradingExchangeApprovalScreen.approveErrorAlert" />
                }
                variant="critical"
            />
        );
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
                    noBorder
                />
            </Card>
        </>
    );
};
