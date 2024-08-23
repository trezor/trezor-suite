import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';

import { getTokens } from 'src/utils/wallet/tokenUtils';
import { useSelector } from 'src/hooks/suite';
import { NoTokens } from '../../common/NoTokens';
import { TokenList } from '../../common/TokensList/TokenList';
import { Translation } from 'src/components/suite';
import styled from 'styled-components';
import { spacings, spacingsPx } from '@trezor/theme';
import { H3, IconLegacy } from '@trezor/components';
import { Text, Row } from '@trezor/components';
import { isTestnet } from '@suite-common/wallet-utils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xxl};
`;

const UnverifiedTokens = styled.div`
    display: flex;
    flex-direction: column;
`;

const UnrecognizedTokensWrapper = styled.div`
    margin-left: ${spacingsPx.sm};
`;

interface HiddenTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

export const HiddenTokensTable = ({ selectedAccount, searchQuery }: HiddenTokensTableProps) => {
    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const sortedTokens = account.tokens
        ? [...account.tokens].sort(
              (a, b) => parseInt(b?.balance || '0') - parseInt(a?.balance || '0'),
          )
        : [];

    const filteredTokens = getTokens(sortedTokens, account.symbol, coinDefinitions, searchQuery);
    const tokens = getTokens(sortedTokens, account.symbol, coinDefinitions);

    const hiddenTokensCount = tokens.hiddenWithBalance.length + tokens.hiddenWithoutBalance.length;
    const unverifiedTokensCount =
        tokens.unverifiedWithBalance.length + tokens.unverifiedWithoutBalance.length;

    return (
        <Wrapper>
            {hiddenTokensCount === 0 && unverifiedTokensCount === 0 && (
                <NoTokens title={<Translation id="TR_HIDDEN_TOKENS_EMPTY" />} />
            )}
            {hiddenTokensCount > 0 && (
                <TokenList
                    hideRates={isTestnet(account.symbol)}
                    account={account}
                    tokenStatusType={TokenManagementAction.SHOW}
                    tokensWithBalance={filteredTokens.hiddenWithBalance}
                    tokensWithoutBalance={filteredTokens.hiddenWithoutBalance}
                    network={network}
                    searchQuery={searchQuery}
                />
            )}
            {unverifiedTokensCount > 0 && (
                <UnverifiedTokens>
                    <UnrecognizedTokensWrapper>
                        <H3>
                            <Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR" />
                        </H3>
                        <Row
                            alignItems="center"
                            gap={spacings.xxs}
                            margin={{ bottom: spacings.xl, top: spacings.xxs }}
                        >
                            <IconLegacy variant="tertiary" size={16} icon="WARNING" />
                            <Text variant="tertiary" typographyStyle="hint">
                                <Translation id="TR_TOKEN_UNRECOGNIZED_BY_TREZOR_TOOLTIP" />
                            </Text>
                        </Row>
                    </UnrecognizedTokensWrapper>
                    <TokenList
                        account={account}
                        hideRates
                        tokenStatusType={TokenManagementAction.SHOW}
                        isUnverifiedTable
                        tokensWithBalance={filteredTokens.unverifiedWithBalance}
                        tokensWithoutBalance={filteredTokens.unverifiedWithoutBalance}
                        network={network}
                        searchQuery={searchQuery}
                    />
                </UnverifiedTokens>
            )}
        </Wrapper>
    );
};
