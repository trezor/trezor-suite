import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';

import { getTokens } from 'src/utils/wallet/tokenUtils';
import { useSelector } from 'src/hooks/suite';
import { NoTokens } from '../../common/NoTokens';
import { TokenList } from '../../common/TokenList';
import { QuestionTooltip, Translation } from 'src/components/suite';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxl};
`;

const UnverifiedTokens = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.md};
`;

interface HiddenTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const HiddenTokensTable = ({ selectedAccount, searchQuery }: HiddenTokensTableProps) => {
    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));
    const isDebug = useSelector(selectIsDebugModeActive);

    const sortedTokens = account.tokens
        ? [...account.tokens].sort(
              (a, b) => parseInt(b?.balance || '0') - parseInt(a?.balance || '0'),
          )
        : [];

    const filteredTokens = getTokens(
        sortedTokens,
        account.symbol,
        isDebug,
        coinDefinitions,
        searchQuery,
    );
    const tokens = getTokens(sortedTokens, account.symbol, isDebug, coinDefinitions);

    const hiddenTokensCount = tokens.hidden.length;
    const unverifiedTokensCount = tokens.unverified.length;

    return (
        <Wrapper>
            {hiddenTokensCount === 0 && unverifiedTokensCount === 0 && (
                <NoTokens title={<Translation id="TR_HIDDEN_TOKENS_EMPTY" />} />
            )}
            {hiddenTokensCount > 0 && (
                <TokenList
                    account={account}
                    tokenStatusType={TokenManagementAction.SHOW}
                    tokens={filteredTokens.hidden}
                    network={network}
                    searchQuery={searchQuery}
                />
            )}
            {unverifiedTokensCount > 0 && (
                <UnverifiedTokens>
                    <QuestionTooltip
                        label="TR_TOKEN_UNRECOGNIZED_BY_TREZOR"
                        tooltip="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP"
                    />
                    <TokenList
                        account={account}
                        hideRates
                        tokenStatusType={TokenManagementAction.SHOW}
                        tokens={filteredTokens.unverified}
                        network={network}
                        searchQuery={searchQuery}
                    />
                </UnverifiedTokens>
            )}
        </Wrapper>
    );
};
