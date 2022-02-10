import React, { Fragment } from 'react';
import styled, { css } from 'styled-components';
import { variables, useTheme, Icon, Card } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, TrezorLink } from '@suite-components';
import { Account } from '@wallet-types';

const Wrapper = styled(Card)<{ isTestnet?: boolean }>`
    display: grid;
    padding: 12px 16px;
    grid-template-columns: ${props => (props.isTestnet ? 'auto auto 44px' : 'auto auto auto 44px')};
    overflow: auto;
`;

interface ColProps {
    justify?: 'left' | 'right';
    paddingHorizontal?: boolean;
    isTestnet?: boolean;
}

const TokenSymbol = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-transform: uppercase;
    padding-right: 2px;
`;

const Col = styled.div<ColProps>`
    display: flex;
    align-items: center;
    padding: 10px 12px 10px 0px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-top: 1px solid ${props => props.theme.STROKE_GREY};

    &:nth-child(${props => (props.isTestnet ? '-n + 3' : '-n + 4')}) {
        /* first row */
        border-top: none;
    }

    ${props =>
        props.justify &&
        css`
            justify-content: ${(props: ColProps) =>
                props.justify === 'right' ? 'flex-end' : 'flex-start'};
            text-align: ${(props: ColProps) => (props.justify === 'right' ? 'right' : 'left')};
        `}

    ${props =>
        props.paddingHorizontal &&
        css`
            padding-left: 14px;
            padding-right: 14px;
        `}
`;

const ColWithoutOverflow = styled(Col)`
    overflow: hidden;
`;

const TokenNameWrapper = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    align-items: center;
`;

const TokenName = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const TokenValue = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    white-space: nowrap;
`;

const FiatWrapper = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const CryptoAmount = styled(FormattedCryptoAmount)`
    display: flex;
    overflow: hidden;
`;

interface Props {
    tokens: Account['tokens'];
    networkType: Account['networkType'];
    explorerUrl: string;
    isTestnet?: boolean;
}

const TokenList = ({ tokens, explorerUrl, isTestnet, networkType }: Props) => {
    const theme = useTheme();
    if (!tokens || tokens.length === 0) return null;

    return (
        <Wrapper isTestnet={isTestnet} noPadding>
            {tokens.map(t => {
                const noName = !t.symbol || t.symbol.toLowerCase() === t.name?.toLowerCase();

                return (
                    <Fragment key={t.address}>
                        <ColWithoutOverflow isTestnet={isTestnet}>
                            <TokenNameWrapper>
                                {!noName && <TokenSymbol>{t.symbol}</TokenSymbol>}
                                {!noName && ` - `}
                                <TokenName>{t.name}</TokenName>
                            </TokenNameWrapper>
                        </ColWithoutOverflow>
                        <Col isTestnet={isTestnet} justify="right">
                            <TokenValue>
                                {t.balance && (
                                    <CryptoAmount
                                        value={t.balance}
                                        symbol={networkType === 'cardano' ? undefined : t.symbol}
                                    />
                                )}
                            </TokenValue>
                        </Col>
                        {!isTestnet && (
                            <Col isTestnet={isTestnet} justify="right">
                                <FiatWrapper>
                                    {t.balance && t.symbol && (
                                        <FiatValue
                                            amount={t.balance}
                                            symbol={t.symbol}
                                            tokenAddress={t.address}
                                        />
                                    )}
                                </FiatWrapper>
                            </Col>
                        )}
                        <Col isTestnet={isTestnet} justify="right">
                            <TrezorLink href={`${explorerUrl}${t.address}`}>
                                <Icon
                                    icon="EXTERNAL_LINK"
                                    size={16}
                                    color={theme.TYPE_LIGHT_GREY}
                                />
                            </TrezorLink>
                        </Col>
                    </Fragment>
                );
            })}
        </Wrapper>
    );
};

export default TokenList;
