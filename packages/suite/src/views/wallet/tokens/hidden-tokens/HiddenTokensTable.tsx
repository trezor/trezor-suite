import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isTestnet, sortTokensByName } from '@suite-common/wallet-utils';
import { Banner, Column, H3 } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { getTokens } from 'src/utils/wallet/tokenUtils';

import { NoTokens } from '../common/NoTokens';
import { NoSearchResultsWrapped, TokensTable } from '../common/TokensTable/TokensTable';

interface HiddenTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const HiddenTokensTable = ({ selectedAccount, searchQuery }: HiddenTokensTableProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const sortedTokens = account.tokens?.toSorted(sortTokensByName) ?? [];

    const filteredTokens = getTokens({
        ...networkConfigDeps,
        tokens: sortedTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
        searchQuery,
    });
    const tokens = getTokens({
        ...networkConfigDeps,
        tokens: sortedTokens,
        symbol: account.symbol,
        tokenDefinitions: coinDefinitions,
    });

    const hiddenTokensCount = tokens.hiddenWithBalance.length + tokens.hiddenWithoutBalance.length;
    const unverifiedTokensCount =
        tokens.unverifiedWithBalance.length + tokens.unverifiedWithoutBalance.length;

    return (
        <Column gap={32}>
            {hiddenTokensCount === 0 && unverifiedTokensCount === 0 && (
                <>
                    {searchQuery ? (
                        <NoSearchResultsWrapped />
                    ) : (
                        <NoTokens title={<Translation id="TR_HIDDEN_TOKENS_EMPTY" />} />
                    )}
                </>
            )}
            {hiddenTokensCount > 0 && (
                <TokensTable
                    hideRates={isTestnet(networkConfigDeps, account.symbol)}
                    account={account}
                    tokenStatusType={TokenManagementAction.SHOW}
                    tokensWithBalance={filteredTokens.hiddenWithBalance}
                    tokensWithoutBalance={filteredTokens.hiddenWithoutBalance}
                    network={network}
                    searchQuery={searchQuery}
                />
            )}
            {unverifiedTokensCount > 0 && (
                <Column gap={12}>
                    <H3>
                        <Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR" />
                    </H3>
                    <Banner
                        intent="warning"
                        icon
                        description={<Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP" />}
                    />
                    <TokensTable
                        type="hidden"
                        account={account}
                        hideRates
                        tokenStatusType={TokenManagementAction.SHOW}
                        isUnverifiedTable
                        tokensWithBalance={filteredTokens.unverifiedWithBalance}
                        tokensWithoutBalance={filteredTokens.unverifiedWithoutBalance}
                        network={network}
                        searchQuery={searchQuery}
                    />
                </Column>
            )}
        </Column>
    );
};
