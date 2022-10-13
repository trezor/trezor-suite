import React, { Fragment } from 'react';
import styled, { css } from 'styled-components';
import { variables, useTheme, Icon, Card } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, TrezorLink } from '@suite-components';
import { Account } from '@wallet-types';

const Wrapper = styled(Card)<{ isTestnet?: boolean }>`
    display: grid;
    padding: 12px 16px;
    grid-template-columns: ${props => (props.isTestnet ? 'auto auto 44px' : 'auto auto auto 44px')};
    word-break: break-all;
`;

const TokenSymbol = styled.span`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-transform: uppercase;
    padding-right: 2px;
`;

interface ColProps {
    justify?: 'left' | 'right';
    isTestnet?: boolean;
}

const Col = styled.div<ColProps>`
    padding: 10px 12px 10px 0px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};

    &:nth-child(${({ isTestnet }) => (isTestnet ? '-n + 3' : '-n + 4')}) {
        /* first row */
        border-top: none;
    }

    ${({ justify }) =>
        justify &&
        css`
            justify-content: ${justify === 'right' ? 'flex-end' : 'flex-start'};
            text-align: ${justify === 'right' ? 'right' : 'left'};
        `}
`;

const TokenName = styled.span`
    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const FiatWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const CryptoAmount = styled(FormattedCryptoAmount)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface TokenListProps {
    tokens: Account['tokens'];
    networkType: Account['networkType'];
    explorerUrl: string;
    isTestnet?: boolean;
}

const TokenList = ({ tokens, explorerUrl, isTestnet, networkType }: TokenListProps) => {
    const theme = useTheme();
    if (!tokens || tokens.length === 0) return null;

    return (
        <Wrapper isTestnet={isTestnet} noPadding>
            {tokens.map(t => {
                const noName = !t.symbol || t.symbol.toLowerCase() === t.name?.toLowerCase();

                return (
                    <Fragment key={t.address}>
                        <Col isTestnet={isTestnet}>
                            {!noName && <TokenSymbol>{t.symbol}</TokenSymbol>}
                            <TokenName>
                                {!noName && ` - `}
                                {t.name}
                            </TokenName>
                        </Col>
                        <Col isTestnet={isTestnet} justify="right">
                            {t.balance && (
                                <CryptoAmount
                                    value={t.balance}
                                    symbol={networkType === 'cardano' ? undefined : t.symbol}
                                />
                            )}
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
