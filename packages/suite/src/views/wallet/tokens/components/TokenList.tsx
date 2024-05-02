import { Fragment } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { variables, Icon, Card } from '@trezor/components';
import {
    FiatValue,
    FormattedCryptoAmount,
    QuestionTooltip,
    TrezorLink,
} from 'src/components/suite';
import { Account } from 'src/types/wallet';
import { useSelector } from 'src/hooks/suite';
import { selectCoinDefinitions, selectFiatRates } from '@suite-common/wallet-core';
import { NoRatesTooltip } from 'src/components/suite/Ticker/NoRatesTooltip';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { spacingsPx, typography } from '@trezor/theme';
import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import { enhanceTokensWithRates, sortTokensWithRates } from 'src/utils/wallet/tokenUtils';
import { Rate } from '@suite-common/wallet-types';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { isTokenDefinitionKnown } from '@suite-common/token-definitions';
import { LastUpdateTooltip } from 'src/components/suite/Ticker/LastUpdateTooltip';

const Wrapper = styled(Card)<{ $isTestnet?: boolean }>`
    display: grid;
    padding: 12px 16px;
    grid-template-columns: ${props =>
        props.$isTestnet ? 'auto auto 44px' : 'auto auto auto 44px'};
    word-break: break-all;
`;

const TokenSymbol = styled.span`
    ${typography.body}
    text-transform: uppercase;
    padding-right: 2px;
`;

interface ColProps {
    $justify?: 'left' | 'right';
    $isTestnet?: boolean;
}

const Col = styled.div<ColProps>`
    ${typography.hint}
    padding: 10px ${spacingsPx.sm} 10px 0;
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};

    &:nth-child(${({ $isTestnet }) => ($isTestnet ? '-n + 3' : '-n + 4')}) {
        /* first row */
        border-top: none;
    }

    ${({ $justify }) =>
        $justify &&
        css`
            justify-content: ${$justify === 'right' ? 'flex-end' : 'flex-start'};
            text-align: ${$justify === 'right' ? 'right' : 'left'};
        `}
`;

const TokenName = styled.span`
    @media only screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const FiatWrapper = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    display: flex;
    justify-content: flex-end;
    width: 100%;
`;

const CryptoAmount = styled(FormattedCryptoAmount)`
    ${typography.body}
    color: ${({ theme }) => theme.textDefault};
`;

const StyledNoRatesTooltip = styled(NoRatesTooltip)`
    justify-content: flex-end;
`;

const StyledQuestionTooltip = styled(QuestionTooltip)<{ $addMarginTop: boolean }>`
    ${({ $addMarginTop }) =>
        $addMarginTop &&
        css`
            margin-top: ${spacingsPx.xxl};
        `}
    margin-bottom: ${spacingsPx.sm};
`;

interface TokenListProps {
    tokens: Account['tokens'];
    networkType: Account['networkType'];
    networkSymbol: NetworkSymbol;
    explorerUrl: string;
    explorerUrlQueryString: string;
    isTestnet?: boolean;
}

type EnhancedTokenInfo = TokenInfo & { fiatRate?: Rate };

export const TokenList = ({
    tokens,
    networkType,
    networkSymbol,
    explorerUrl,
    explorerUrlQueryString,
    isTestnet,
}: TokenListProps) => {
    const theme = useTheme();
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, networkSymbol));
    const fiatRates = useSelector(selectFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);

    const tokensWithRates = enhanceTokensWithRates(tokens, localCurrency, networkSymbol, fiatRates);

    const sortedTokens = tokensWithRates.sort(sortTokensWithRates);

    if (!tokens || tokens.length === 0) return null;

    const hasCoinDefinitions = getNetworkFeatures(networkSymbol).includes('coin-definitions');
    const { knownTokens, unknownTokens } = sortedTokens.reduce<{
        knownTokens: EnhancedTokenInfo[];
        unknownTokens: EnhancedTokenInfo[];
    }>(
        (acc, token) => {
            if (
                !hasCoinDefinitions ||
                isTokenDefinitionKnown(coinDefinitions?.data, networkSymbol, token.contract)
            ) {
                acc.knownTokens.push(token);
            } else {
                acc.unknownTokens.push(token);
            }

            return acc;
        },
        { knownTokens: [], unknownTokens: [] },
    );

    return (
        <>
            {[knownTokens, unknownTokens].map((tokens, groupIndex) =>
                tokens.length ? (
                    <Fragment key={groupIndex === 0 ? 'knownTokens' : 'unknownTokens'}>
                        {groupIndex === 1 && (
                            <StyledQuestionTooltip
                                label="TR_TOKEN_UNRECOGNIZED_BY_TREZOR"
                                tooltip="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP"
                                $addMarginTop={!!knownTokens.length}
                            />
                        )}
                        <Wrapper $isTestnet={isTestnet} paddingType="none">
                            {tokens.map(t => {
                                const symbolMatchesName =
                                    networkType === 'cardano' &&
                                    t.symbol?.toLowerCase() === t.name?.toLowerCase();
                                const noSymbol = !t.symbol || symbolMatchesName;

                                return (
                                    <Fragment key={t.contract}>
                                        <Col $isTestnet={isTestnet}>
                                            {!noSymbol && <TokenSymbol>{t.symbol}</TokenSymbol>}
                                            <TokenName>
                                                {!noSymbol && ` - `}
                                                {t.name}
                                            </TokenName>
                                        </Col>
                                        <Col $isTestnet={isTestnet} $justify="right">
                                            {t.balance && (
                                                <CryptoAmount
                                                    value={t.balance}
                                                    symbol={
                                                        networkType === 'cardano'
                                                            ? undefined
                                                            : t.symbol
                                                    }
                                                />
                                            )}
                                        </Col>
                                        {!isTestnet && (
                                            <Col $isTestnet={isTestnet} $justify="right">
                                                <FiatWrapper>
                                                    <FiatValue
                                                        amount={t.balance || '1'}
                                                        symbol={networkSymbol}
                                                        tokenAddress={t.contract}
                                                        showLoadingSkeleton={groupIndex === 0}
                                                    >
                                                        {({ value, timestamp }) =>
                                                            value && timestamp ? (
                                                                <LastUpdateTooltip
                                                                    timestamp={timestamp}
                                                                >
                                                                    <>{value}</>
                                                                </LastUpdateTooltip>
                                                            ) : (
                                                                <StyledNoRatesTooltip />
                                                            )
                                                        }
                                                    </FiatValue>
                                                </FiatWrapper>
                                            </Col>
                                        )}
                                        <Col $isTestnet={isTestnet} $justify="right">
                                            <TrezorLink
                                                href={`${explorerUrl}${t.contract}${explorerUrlQueryString}`}
                                            >
                                                <Icon
                                                    icon="EXTERNAL_LINK"
                                                    size={16}
                                                    color={theme.iconSubdued}
                                                />
                                            </TrezorLink>
                                        </Col>
                                    </Fragment>
                                );
                            })}
                        </Wrapper>
                    </Fragment>
                ) : null,
            )}
        </>
    );
};
