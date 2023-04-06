import React, { Fragment } from 'react';
import styled, { css } from 'styled-components';
import { variables, useTheme, Icon, Card } from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, TrezorLink } from '@suite-components';
import { Account } from '@wallet-types';
import { useSelector } from '@suite-hooks';
import BigNumber from 'bignumber.js';
import { FiatRates, TokenInfo } from '@trezor/connect';

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

interface TokensWithRates extends TokenInfo {
    rates?: FiatRates;
}

const getBalanceInUSD = (balance: TokenInfo['balance'], rate?: FiatRates['usd']) =>
    new BigNumber(balance || 0).multipliedBy(rate || 0);

const sortTokens = (a: TokensWithRates, b: TokensWithRates) => {
    const aBalanceUSD = getBalanceInUSD(a.balance, a.rates?.usd);
    const bBalanceUSD = getBalanceInUSD(b.balance, b.rates?.usd);

    const balanceSort =
        // Sort by balance multiplied by USD rate
        bBalanceUSD.minus(aBalanceUSD).toNumber() ||
        // If balance is equal, sort by USD rate
        (b.rates?.usd || -1) - (a.rates?.usd || -1) ||
        // If USD rate is equal or missing, sort by symbol length
        (a.symbol || '').length - (b.symbol || '').length ||
        // If symbol length is equal, sort by symbol name alphabetically
        (a.symbol || '').localeCompare(b.symbol || '');

    return balanceSort;
};

interface TokenListProps {
    tokens: Account['tokens'];
    networkType: Account['networkType'];
    explorerUrl: string;
    isTestnet?: boolean;
}

export const TokenList = ({ tokens, explorerUrl, isTestnet, networkType }: TokenListProps) => {
    const theme = useTheme();
    const fiat = useSelector(state => state.wallet.fiat);

    // sort by 1. total fiat, 2. token price, 3. symbol length, 4. alphabetically
    const sortedTokens = React.useMemo(() => {
        if (!tokens?.length) return [];

        const tokensWithRates = tokens.map(token => ({
            ...token,
            rates: fiat.coins.find(
                coin =>
                    coin.symbol.toLowerCase() === token.symbol?.toLowerCase() &&
                    coin.tokenAddress?.toLowerCase() === token.address.toLowerCase(),
            )?.current?.rates,
        }));

        return tokensWithRates.sort(sortTokens);
    }, [tokens, fiat.coins]);

    if (!tokens || tokens.length === 0) return null;

    return (
        <Wrapper isTestnet={isTestnet} noPadding>
            {sortedTokens.map(t => {
                // In Cardano token name is optional and in there is no symbol.
                // However, if Cardano token doesn't have a name on blockchain, its TokenInfo has both name
                // and symbol props set to a token fingerprint (done in blockchain-link) and we
                // don't want to render it twice.
                // In ethereum we are fine with rendering symbol - name even if they are the same.
                const symbolMatchesName =
                    networkType === 'cardano' && t.symbol?.toLowerCase() === t.name?.toLowerCase();
                const noSymbol = !t.symbol || symbolMatchesName;

                return (
                    <Fragment key={t.address}>
                        <Col isTestnet={isTestnet}>
                            {!noSymbol && <TokenSymbol>{t.symbol}</TokenSymbol>}
                            <TokenName>
                                {!noSymbol && ` - `}
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
