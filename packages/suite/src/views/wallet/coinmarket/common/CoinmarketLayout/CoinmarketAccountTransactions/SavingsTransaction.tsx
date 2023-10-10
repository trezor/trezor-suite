import styled, { useTheme } from 'styled-components';

import { variables, Icon } from '@trezor/components';
import {
    Translation,
    HiddenPlaceholder,
    FormattedDate,
    FormattedCryptoAmount,
} from 'src/components/suite';
import type { TradeSavings } from 'src/types/wallet/coinmarketCommonTypes';
import type { SavingsProviderInfo } from 'invity-api';
import { CoinmarketProviderInfo, CoinmarketPaymentType } from 'src/views/wallet/coinmarket/common';
import { useWatchSavingsTrade } from 'src/hooks/wallet/useCoinmarket';
import type { Account } from 'src/types/wallet';
import { CoinmarketTransactionStatus } from './CoinmarketTransactionStatus';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        background: ${({ theme }) => theme.BG_WHITE};
        border: 1px solid ${({ theme }) => theme.TYPE_WHITE};
        box-shadow: 0 1px 2px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const StyledStatus = styled(CoinmarketTransactionStatus)`
    margin-left: 5px;
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 17px 24px;
    overflow: hidden;
`;

const ProviderColumn = styled(Column)`
    max-width: 200px;
`;

const TradeID = styled.span`
    padding-left: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const RowSecond = styled(Row)`
    padding-top: 8px;
    display: flex;

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        justify-content: center;
    }
`;

const SmallRow = styled.div`
    padding-top: 8px;
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const SmallRowStatus = styled(SmallRow)`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Amount = styled.div``;

const Arrow = styled.div`
    display: flex;
    align-items: center;
    padding: 0 11px;
`;

interface SavingsTransactionProps {
    trade: TradeSavings;
    account: Account;
    providers?: {
        [name: string]: SavingsProviderInfo;
    };
}

export const SavingsTransaction = ({ trade, providers, account }: SavingsTransactionProps) => {
    const theme = useTheme();

    useWatchSavingsTrade(account, trade);

    const { date, data } = trade;
    const {
        fiatStringAmount,
        fiatCurrency,
        receiveStringAmount,
        receiveCurrency,
        exchange,
        paymentMethod,
        paymentMethodName,
    } = data;

    return (
        <Wrapper>
            <Column>
                <Row>
                    <Amount>
                        <HiddenPlaceholder>
                            {fiatStringAmount} {fiatCurrency}
                        </HiddenPlaceholder>
                    </Amount>
                    <Arrow>
                        <Icon color={theme.TYPE_LIGHT_GREY} size={13} icon="ARROW_RIGHT" />
                    </Arrow>
                    <FormattedCryptoAmount value={receiveStringAmount} symbol={receiveCurrency} />
                </Row>
                <SmallRowStatus>
                    {trade.tradeType.toUpperCase()} • <FormattedDate value={date} date time /> •{' '}
                    <StyledStatus trade={data} tradeType={trade.tradeType} />
                </SmallRowStatus>
                <SmallRow>
                    <Translation id="TR_SAVINGS_TRANS_ID" />
                    <TradeID>{trade.data.id}</TradeID>
                </SmallRow>
            </Column>
            <ProviderColumn>
                <Row>
                    <CoinmarketProviderInfo exchange={exchange} providers={providers} />
                </Row>
                <RowSecond>
                    <CoinmarketPaymentType method={paymentMethod} methodName={paymentMethodName} />
                </RowSecond>
            </ProviderColumn>
        </Wrapper>
    );
};
