import React from 'react';
import styled from 'styled-components';
import { useTheme, variables, Icon } from '@trezor/components';
import {
    Translation,
    HiddenPlaceholder,
    FormattedDate,
    FormattedCryptoAmount,
} from '@suite-components';
import type { TradeSavings } from '@wallet-types/coinmarketCommonTypes';
import Status from '../Status';
import type { SavingsProviderInfo } from 'invity-api';
import { CoinmarketProviderInfo, CoinmarketPaymentType } from '@wallet-components';
import { useWatchSavingsTrade } from '@wallet-hooks/useCoinmarket';
import type { Account } from '@wallet-types';

interface Props {
    trade: TradeSavings;
    account: Account;
    providers?: {
        [name: string]: SavingsProviderInfo;
    };
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-bottom: 20px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    border-radius: 4px;
    padding: 12px 0;

    &:hover {
        background: ${props => props.theme.BG_WHITE};
        border: 1px solid ${props => props.theme.TYPE_WHITE};
        box-shadow: 0 1px 2px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const StyledStatus = styled(Status)`
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Row = styled.div`
    display: flex;
    align-items: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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

const SavingsTransaction = ({ trade, providers, account }: Props) => {
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
                    <CoinmarketPaymentType method={paymentMethod} />
                </RowSecond>
            </ProviderColumn>
        </Wrapper>
    );
};

export default SavingsTransaction;
