import { useState } from 'react';
import styled from 'styled-components';

import { Account } from '@suite-common/wallet-types';
import { NetworkCompatible } from '@suite-common/wallet-config';
import { EnhancedTokenInfo, TokenManagementAction } from '@suite-common/token-definitions';
import { spacings } from '@trezor/theme';
import { Icon, Table, Paragraph, Card, Row, Text } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { TokenRow } from './TokenRow';

const IconWrapper = styled.div<{ $isActive: boolean }>`
    transition: transform 0.2s ease-in-out;
    transform: ${({ $isActive }) => ($isActive ? 'rotate(0)' : 'rotate(-90deg)')};
`;

const ZeroBalanceToggle = styled.div`
    cursor: pointer;
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

    return (
        <Card paddingType="none" overflow="hidden">
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
                            <Table.Cell colSpan={hideRates ? 2 : 1}>
                                <Translation id="TR_VALUES" />
                            </Table.Cell>
                            {!hideRates && (
                                <>
                                    <Table.Cell align="right">
                                        <Translation id="TR_EXCHANGE_RATE" />
                                    </Table.Cell>
                                    <Table.Cell colSpan={2}>
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
                                    <Table.Cell colSpan={2}>
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
                                        isCollapsed={!isZeroBalanceOpen}
                                    />
                                ))}
                            </>
                        )}
                    </Table.Body>
                </Table>
            )}
        </Card>
    );
};
