import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';

import { getTokens } from 'src/utils/wallet/tokenUtils';
import { useSelector } from 'src/hooks/suite';
import { NoTokens } from '../../common/NoTokens';
import { TokenList } from '../../common/TokenList';
import { QuestionTooltip, Translation } from 'src/components/suite';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

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
}

export const HiddenTokensTable = ({ selectedAccount }: HiddenTokensTableProps) => {
    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const sortedTokens = account.tokens
        ? [...account.tokens].sort(
              (a, b) => parseInt(b?.balance || '0') - parseInt(a?.balance || '0'),
          )
        : [];

    const hiddenTokens = getTokens(sortedTokens, account.symbol, 'hidden', coinDefinitions);
    const unverifiedTokens = getTokens(sortedTokens, account.symbol, 'unverified', coinDefinitions);

    const hiddenTokensCount = hiddenTokens.length;
    const unverifiedTokensCount = unverifiedTokens.length;

    return (
        <Wrapper>
            {hiddenTokensCount === 0 && unverifiedTokensCount === 0 && (
                <NoTokens title={<Translation id="TR_HIDDEN_TOKENS_EMPTY" />} />
            )}
            {hiddenTokensCount > 0 && (
                <TokenList
                    hideRates
                    tokenStatusType={TokenManagementAction.SHOW}
                    tokens={hiddenTokens}
                    network={network}
                />
            )}
            {unverifiedTokensCount > 0 && (
                <UnverifiedTokens>
                    <QuestionTooltip
                        label="TR_TOKEN_UNRECOGNIZED_BY_TREZOR"
                        tooltip="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP"
                    />
                    <TokenList
                        hideRates
                        tokenStatusType={TokenManagementAction.SHOW}
                        tokens={unverifiedTokens}
                        network={network}
                    />
                </UnverifiedTokens>
            )}
        </Wrapper>
    );
};
