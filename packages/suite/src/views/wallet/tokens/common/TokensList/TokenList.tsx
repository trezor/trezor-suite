import styled, { css, useTheme } from 'styled-components';
import { Card, Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { spacingsPx, typography } from '@trezor/theme';
import { Account } from '@suite-common/wallet-types';
import { Network } from '@suite-common/wallet-config';
import { EnhancedTokenInfo, TokenManagementAction } from '@suite-common/token-definitions';
import { useState } from 'react';
import { AnimationWrapper } from 'src/components/wallet/AnimationWrapper';
import { TokenRow } from './TokenRow';

const Table = styled(Card)`
    word-break: break-all;
`;

const Columns = styled.div`
    display: flex;
    padding: 0 ${spacingsPx.lg};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
`;

const ColName = styled.div`
    ${typography.hint}
    margin: ${spacingsPx.md} 0;
    color: ${({ theme }) => theme.textSubdued};
    width: 20%;
`;

const NoResults = styled.div`
    ${typography.body};
    padding: ${spacingsPx.lg};
    text-align: center;
`;

const ChevronIcon = styled(Icon)<{ $isActive: boolean }>`
    padding: ${spacingsPx.sm};
    border-radius: 50%;
    transition:
        background 0.2s,
        transform 0.2s ease-in-out;
    transform: ${({ $isActive }) => ($isActive ? 'rotate(0)' : 'rotate(-90deg)')};
`;

const Header = styled.header<{ $isActive: boolean }>`
    display: flex;
    padding: ${spacingsPx.xs};
    margin: 0 ${spacingsPx.lg};
    cursor: pointer;
    align-items: center;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    ${({ $isActive }) =>
        $isActive &&
        css`
            border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
        `};
`;

const ChevronContainer = styled.div`
    width: ${spacingsPx.xxxl};
`;

interface TokenListProps {
    account: Account;
    tokensWithBalance: EnhancedTokenInfo[];
    tokensWithoutBalance: EnhancedTokenInfo[];
    network: Network;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
    searchQuery?: string;
    isUnverifiedTable?: boolean;
}

export const TokenList = ({
    account,
    tokensWithBalance,
    tokensWithoutBalance,
    network,
    tokenStatusType,
    hideRates,
    searchQuery,
    isUnverifiedTable,
}: TokenListProps) => {
    const [isZeroBalanceOpen, setIsZeroBalanceOpen] = useState(false);

    const theme = useTheme();

    return (
        <Table paddingType="none">
            <Columns>
                <ColName>
                    <Translation id="TR_TOKEN" />
                </ColName>
                <ColName>
                    <Translation id="TR_VALUES" />
                </ColName>
                {!hideRates && (
                    <>
                        <ColName>
                            <Translation id="TR_EXCHANGE_RATE" />
                        </ColName>
                        <ColName>
                            <Translation id="TR_7D_CHANGE" />
                        </ColName>
                    </>
                )}
            </Columns>
            {tokensWithBalance.length === 0 && tokensWithoutBalance.length === 0 && searchQuery ? (
                <NoResults>
                    <Translation id="TR_NO_SEARCH_RESULTS" />
                </NoResults>
            ) : (
                tokensWithBalance.map(token => (
                    <TokenRow
                        key={token.symbol}
                        token={token}
                        account={account}
                        network={network}
                        tokenStatusType={tokenStatusType}
                        isUnverifiedTable={isUnverifiedTable}
                    />
                ))
            )}
            {tokensWithoutBalance.length !== 0 && (
                <>
                    <Header
                        $isActive={isZeroBalanceOpen}
                        onClick={() => setIsZeroBalanceOpen(!isZeroBalanceOpen)}
                    >
                        <ChevronContainer>
                            <ChevronIcon
                                $isActive={isZeroBalanceOpen}
                                size={18}
                                color={theme.iconSubdued}
                                icon="ARROW_DOWN"
                            />
                        </ChevronContainer>
                        <Translation id="ZERO_BALANCE_TOKENS" />
                    </Header>
                    <AnimationWrapper opened={isZeroBalanceOpen}>
                        {tokensWithoutBalance.map(token => (
                            <TokenRow
                                key={token.symbol}
                                token={token}
                                account={account}
                                network={network}
                                tokenStatusType={tokenStatusType}
                                isUnverifiedTable={isUnverifiedTable}
                            />
                        ))}
                    </AnimationWrapper>
                </>
            )}
        </Table>
    );
};
