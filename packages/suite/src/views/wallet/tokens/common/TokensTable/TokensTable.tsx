import { useState } from 'react';

import { EnhancedTokenInfo, TokenManagementAction } from '@suite-common/token-definitions';
import { Network } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Card, Paragraph, Table } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useTradingLoadData } from 'src/hooks/wallet/trading/useTradingLoadData';

import { TokenRow } from './TokenRow';
import { DropdownRow } from '../../DropdownRow';

const NoSearchResults = () => (
    <Paragraph margin={{ top: spacings.xxl, bottom: spacings.xxl }} align="center">
        <Translation id="TR_NO_SEARCH_RESULTS" />
    </Paragraph>
);

export const NoSearchResultsWrapped = () => (
    <Card paddingType="none" overflow="hidden">
        <NoSearchResults />
    </Card>
);

interface TokensTableProps {
    account: Account;
    tokensWithBalance: EnhancedTokenInfo[];
    tokensWithoutBalance: EnhancedTokenInfo[];
    network: Network;
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
    useTradingLoadData();

    return (
        <Card paddingType="none" overflow="hidden">
            {tokensWithBalance.length === 0 && tokensWithoutBalance.length === 0 && searchQuery ? (
                <NoSearchResults />
            ) : (
                <Table
                    margin={{ top: spacings.xs }}
                    colWidths={[
                        { minWidth: '200px', maxWidth: '250px' },
                        { minWidth: '140px', maxWidth: '250px' }, // due to HiddenPlaceholder - it changes content width when hovered
                    ]}
                    isRowHighlightedOnHover
                >
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
                                    <Table.Cell align="end">
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
                                key={token.contract}
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
                                <Table.Row onClick={() => setIsZeroBalanceOpen(!isZeroBalanceOpen)}>
                                    <Table.Cell colSpan={1}>
                                        <DropdownRow
                                            isActive={isZeroBalanceOpen}
                                            text="ZERO_BALANCE_TOKENS"
                                            typographyStyle="hint"
                                            variant="tertiary"
                                        />
                                    </Table.Cell>
                                    <Table.Cell colSpan={hideRates ? 2 : 4} />
                                </Table.Row>
                                {tokensWithoutBalance.map(token => (
                                    <TokenRow
                                        key={token.contract}
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
