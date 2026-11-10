import { type ReactNode } from 'react';

import styled from 'styled-components';

import {
    type TradingProviderInfo,
    type TradingTransactionStatus,
    type TradingType,
} from '@suite-common/trading';
import { Card, Column } from '@trezor/components';

import { AfterTradeExperiment } from './AfterTradeExperiment';
import { TradingDetailSupportBanner } from './TradingDetailSupportBanner';
import { useTradingDetailStatusAnalytics } from '../../../../../hooks/wallet/trading/useTradingDetailStatusAnalytics';
import { type TradingGetCryptoQuoteAmountProps } from '../../../../../types/trading/trading';
import { type TradingDetailStatusStep } from '../../../../../types/trading/tradingDetail';
import { TradingWrapper } from '../TradingWrapper';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

type TradingDetailLayoutProps = {
    tradeType: TradingType;
    tradeStatus: TradingTransactionStatus;
    statusStep: TradingDetailStatusStep | undefined;
    provider?: TradingProviderInfo;
    tradeId?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
    country?: string;
    banner?: ReactNode;
    sidebar: ReactNode;
    children: ReactNode;
};

export const TradingDetailLayout = ({
    tradeType,
    tradeStatus,
    statusStep,
    provider,
    tradeId,
    quoteAmounts,
    country,
    banner,
    sidebar,
    children,
}: TradingDetailLayoutProps) => {
    useTradingDetailStatusAnalytics({ tradeType, tradeStatus, statusStep });

    return (
        <Wrapper data-testid="@trading/transaction/detail">
            <Column gap={20}>
                <Card paddingType="none" data-testid="@trading/transaction/detail/status-card">
                    {children}
                </Card>
                {banner}
                <AfterTradeExperiment
                    status={tradeStatus}
                    type={tradeType}
                    provider={provider?.name}
                    id={tradeId}
                    quoteAmounts={quoteAmounts}
                    country={country}
                />
                <TradingDetailSupportBanner provider={provider} />
            </Column>
            {sidebar}
        </Wrapper>
    );
};
