import { useState } from 'react';
import styled, { css, useTheme } from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { NetworkCompatible } from '@suite-common/wallet-config';
import { EnhancedTokenInfo, TokenManagementAction } from '@suite-common/token-definitions';
import { Elevation, mapElevationToBorder, spacings, spacingsPx, typography } from '@trezor/theme';
import { Icon, Table, useElevation } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { AnimationWrapper } from 'src/components/wallet/AnimationWrapper';
import { TokenRow } from './TokenRow';

const NoResults = styled.div`
    ${typography.body};
    padding: ${spacingsPx.lg};
    text-align: center;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const ChevronIcon = styled(Icon)<{ $isActive: boolean }>`
    padding: ${spacingsPx.sm};
    border-radius: 50%;
    transition:
        background 0.2s,
        transform 0.2s ease-in-out;
    transform: ${({ $isActive }) => ($isActive ? 'rotate(0)' : 'rotate(-90deg)')};
`;

const Header = styled.td<{ $elevation: Elevation; $isActive: boolean }>`
    display: flex;
    margin: 0 ${spacingsPx.xl};
    cursor: pointer;
    align-items: center;
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
    ${({ $isActive, $elevation, theme }) =>
        $isActive &&
        css`
            border-bottom: 1px solid ${mapElevationToBorder({ $elevation, theme })};
        `};
`;

const ChevronContainer = styled.div`
    width: ${spacingsPx.xxxl};
`;

interface TokensTableProps {
    account: Account;
    tokensWithBalance: EnhancedTokenInfo[];
    tokensWithoutBalance: EnhancedTokenInfo[];
    network: NetworkCompatible;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
    searchQuery?: string;
    isUnverifiedTable?: boolean;
}

export const TokensTable = ({
    account,
    tokensWithBalance,
    tokensWithoutBalance,
    network,
    tokenStatusType,
    hideRates,
    searchQuery,
    isUnverifiedTable,
}: TokensTableProps) => {
    const [isZeroBalanceOpen, setIsZeroBalanceOpen] = useState(false);

    const { elevation } = useElevation();
    const theme = useTheme();

    return (
        <Card paddingType="none">
            {tokensWithBalance.length === 0 && tokensWithoutBalance.length === 0 && searchQuery ? (
                <Paragraph
                    typographyStyle="highlight"
                    margin={{ top: spacings.xxl, bottom: spacings.xxl }}
                    align="center"
                >
                    <Translation id="TR_NO_SEARCH_RESULTS" />
                </Paragraph>
            ) : (
                <Table margin={{ top: spacings.xs, bottom: spacings.xs }} colWidths={['250px']}>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Translation id="TR_TOKEN" />
                            </Table.Cell>
                            <Table.Cell colspan={hideRates ? 2 : 1}>
                                <Translation id="TR_VALUES" />
                            </Table.Cell>
                            {!hideRates && (
                                <>
                                    <Table.Cell align="right">
                                        <Translation id="TR_EXCHANGE_RATE" />
                                    </Table.Cell>
                                    <Table.Cell colspan={2}>
                                        <Translation id="TR_7D_CHANGE" />
                                    </Table.Cell>
                                </>
                            )}
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {tokensWithBalance.map(token => (
                            <TokenRow
                                key={token.symbol}
                                token={token}
                                account={account}
                                network={network}
                                tokenStatusType={tokenStatusType}
                                isUnverifiedTable={isUnverifiedTable}
                                hideRates={hideRates}
                            />
                        ))}
                        {tokensWithoutBalance.length !== 0 && (
                            <>
                                <Table.Row>
                                    <Table.Cell colspan={2}>
                                        <ZeroBalanceToggle
                                            onClick={() => setIsZeroBalanceOpen(!isZeroBalanceOpen)}
                                        >
                                            <Row gap={spacings.xs} margin={{ top: spacings.md }}>
                                                <IconWrapper $isActive={isZeroBalanceOpen}>
                                                    <Icon
                                                        size={18}
                                                        variant="tertiary"
                                                        name="chevronDown"
                                                    />
                                                </IconWrapper>
                                                <Text typographyStyle="hint" variant="tertiary">
                                                    <Translation id="ZERO_BALANCE_TOKENS" />
                                                </Text>
                                            </Row>
                                        </ZeroBalanceToggle>
                                    </Table.Cell>
                                </Table.Row>
                                {tokensWithoutBalance.map(token => (
                                    <TokenRow
                                        key={token.symbol}
                                        token={token}
                                        account={account}
                                        network={network}
                                        tokenStatusType={tokenStatusType}
                                        isUnverifiedTable={isUnverifiedTable}
                                        hideRates={hideRates}
                                    />
                                ))}
                            </AnimationWrapper>
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
};
