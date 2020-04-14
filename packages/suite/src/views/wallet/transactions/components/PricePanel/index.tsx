import {
    Badge,
    Card,
    FiatValue,
    FormattedNumber,
    HiddenPlaceholder,
    NoRatesTooltip,
    Translation,
} from '@suite-components';
import messages from '@suite/support/messages';
import { CoinLogo, colors, Icon, Tooltip, variables } from '@trezor/components';
import { getAccountFiatBalance, getTitleForNetwork, isTestnet } from '@wallet-utils/accountUtils';
import { differenceInMinutes } from 'date-fns';
import React from 'react';
import { FormattedRelativeTime } from 'react-intl';
import styled, { keyframes } from 'styled-components';

import { Props } from './Container';

const Wrapper = styled(Card)`
    width: 100%;
    min-height: 95px;
    border-radius: 6px;
    margin-bottom: 26px;
    padding: 20px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
`;

const Balance = styled.div`
    font-size: ${variables.FONT_SIZE.H1};
    font-weight: ${variables.FONT_WEIGHT.LIGHT};
    margin: 0px 10px;
    white-space: nowrap;
`;

const Col = styled.div`
    display: flex;
    align-items: center;
`;

const Ticker = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 240px;
    border-radius: 3px;
    background: ${colors.BLACK92};
    padding: 8px 10px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const TickerTitle = styled.div`
    text-transform: uppercase;
    font-size: ${variables.FONT_SIZE.TINY};
    color: #a0a0a0;
`;

const TickerPrice = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
`;

const FlickerAnimation = keyframes`
    0% { 
        opacity: 1;
    }
    50% { 
        opacity: 0;
    }
    100% { 
        opacity: 1;
    }
`;

const LiveWrapper = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.GREEN};
    align-items: center;
    text-transform: uppercase;
    animation: ${FlickerAnimation} 2s 3;
`;

const Live = styled.div`
    display: flex;
`;

const Dot = styled.div`
    display: flex;
    width: 6px;
    height: 6px;
    background-color: ${colors.GREEN};
    border-radius: 50%;
    margin-right: 3px;
    margin-top: -1px;
`;

const LastUpdate = styled.div`
    text-transform: none;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

export default ({ settings, selectedAccount, fiat }: Props) => {
    const { localCurrency } = settings;
    if (selectedAccount.status !== 'loaded') return null;

    const { account } = selectedAccount;
    const { symbol, formattedBalance } = account;
    const fiatBalance = getAccountFiatBalance(account, localCurrency, fiat);
    const MAX_AGE = 5; // after 5 minutes the ticker will show tooltip with info about last update instead of blinking LIVE text
    const rateAge = (timestamp: number) => differenceInMinutes(new Date(), new Date(timestamp));

    return (
        <Wrapper title={<Translation id="TR_TRANSACTIONS" />}>
            <Col>
                <CoinLogo size={24} symbol={symbol} />
                <HiddenPlaceholder intensity={7}>
                    <Balance>
                        {formattedBalance} {symbol.toUpperCase()}
                    </Balance>
                </HiddenPlaceholder>
                {fiatBalance && (
                    <HiddenPlaceholder intensity={7}>
                        <Badge>
                            <FormattedNumber value={fiatBalance} currency={localCurrency} />
                        </Badge>
                    </HiddenPlaceholder>
                )}
            </Col>
            {!isTestnet(symbol) && (
                <Col>
                    <Ticker>
                        <Row>
                            <TickerTitle>
                                <Translation {...getTitleForNetwork(symbol)} /> price (
                                {symbol.toUpperCase()})
                            </TickerTitle>
                            <FiatValue amount="1" symbol={symbol}>
                                {({ value, timestamp }) =>
                                    value && timestamp ? (
                                        <>
                                            {rateAge(timestamp) >= MAX_AGE ? (
                                                <Tooltip
                                                    maxWidth={285}
                                                    placement="top"
                                                    content={
                                                        <LastUpdate>
                                                            <Translation
                                                                {...messages.TR_LAST_UPDATE}
                                                                values={{
                                                                    value: (
                                                                        <FormattedRelativeTime
                                                                            value={
                                                                                rateAge(timestamp) *
                                                                                -60
                                                                            }
                                                                            numeric="auto"
                                                                            updateIntervalInSeconds={
                                                                                10
                                                                            }
                                                                        />
                                                                    ),
                                                                }}
                                                            />
                                                        </LastUpdate>
                                                    }
                                                >
                                                    <StyledIcon
                                                        icon="QUESTION"
                                                        color={colors.BLACK50}
                                                        hoverColor={colors.BLACK25}
                                                        size={14}
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <LiveWrapper key={symbol}>
                                                    <Dot />
                                                    <Live>
                                                        <Translation {...messages.TR_LIVE} />
                                                    </Live>
                                                </LiveWrapper>
                                            )}
                                        </>
                                    ) : null
                                }
                            </FiatValue>
                        </Row>
                        <TickerPrice>
                            <FiatValue amount="1" symbol={symbol}>
                                {({ value }) => value ?? <NoRatesTooltip />}
                            </FiatValue>
                        </TickerPrice>
                    </Ticker>
                </Col>
            )}
        </Wrapper>
    );
};
