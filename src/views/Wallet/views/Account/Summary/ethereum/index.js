/* @flow */
import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import * as stateUtils from 'reducers/utils';
import { FormattedMessage } from 'react-intl';

import {
    H5,
    CoinLogo,
    Icon,
    Link,
    AsyncSelect,
    Tooltip,
    colors,
    icons as ICONS,
} from 'trezor-ui-components';
import Content from 'views/Wallet/components/Content';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';
import l10nCommonMessages from 'views/common.messages';
import l10nSummaryMessages from '../common.messages';
import AccountBalance from '../components/Balance';
import AddedToken from '../components/Token';
import AddTokenMessage from '../components/AddTokenMessage';

import type { Props } from './Container';

const AccountHeading = styled.div`
    padding-bottom: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const TokensHeadingWrapper = styled.div`
    display: flex;
    padding: 20px 0;
`;

const AccountName = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const AccountTitle = styled.div`
    font-size: ${FONT_SIZE.WALLET_TITLE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${colors.WALLET_TITLE};
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const TooltipContainer = styled.div`
    margin-left: 6px;
`;

const StyledLink = styled(Link)`
    font-size: ${FONT_SIZE.SMALL};
`;

const AsyncSelectWrapper = styled.div`
    padding-bottom: 32px;
`;

const AddedTokensWrapper = styled.div``;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

const AccountSummary = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const { account, network, tokens, pending, shouldRender } = props.selectedAccount;

    if (!device || !account || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    const explorerLink: string = `${network.explorer.address}${account.descriptor}`;
    const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, network.symbol);
    const balance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);

    return (
        <Content>
            <React.Fragment>
                <AccountHeading>
                    <AccountName>
                        <StyledCoinLogo height={23} network={account.network} />
                        <AccountTitle>
                            <FormattedMessage
                                {...l10nCommonMessages.TR_ACCOUNT_HASH}
                                values={{ number: parseInt(account.index, 10) + 1 }}
                            />
                        </AccountTitle>
                    </AccountName>
                    <StyledLink href={explorerLink} isGray>
                        <FormattedMessage
                            {...l10nSummaryMessages.TR_SEE_FULL_TRANSACTION_HISTORY}
                        />
                    </StyledLink>
                </AccountHeading>
                <AccountBalance
                    network={network}
                    balance={balance}
                    fiat={props.fiat}
                    localCurrency={props.wallet.localCurrency}
                    isHidden={props.wallet.hideBalance}
                />
                <TokensHeadingWrapper>
                    <H5>
                        <FormattedMessage {...l10nSummaryMessages.TR_TOKENS} />
                    </H5>
                    <TooltipContainer>
                        <Tooltip
                            maxWidth={200}
                            placement="top"
                            content={props.intl.formatMessage(l10nSummaryMessages.TR_INSERT_TOKEN_NAME)}
                        >
                            <StyledIcon icon={ICONS.HELP} color={colors.TEXT_SECONDARY} size={12} />
                        </Tooltip>
                    </TooltipContainer>
                </TokensHeadingWrapper>
                <AsyncSelectWrapper>
                    <AsyncSelect
                        isSearchable
                        withDropdownIndicator={false}
                        defaultOptions
                        value={null}
                        isMulti={false}
                        placeholder={props.intl.formatMessage(
                            l10nSummaryMessages.TR_TYPE_IN_A_TOKEN_NAME
                        )}
                        loadingMessage={() =>
                            props.intl.formatMessage(l10nCommonMessages.TR_LOADING_DOT_DOT_DOT)
                        }
                        noOptionsMessage={() =>
                            props.intl.formatMessage(l10nSummaryMessages.TR_TOKEN_NOT_FOUND)
                        }
                        onChange={token => {
                            if (token.name) {
                                const isAdded = tokens.find(t => t.symbol === token.symbol);
                                if (!isAdded) {
                                    props.addToken(token, account);
                                }
                            }
                        }}
                        loadOptions={input => props.loadTokens(input, account.network)}
                        formatOptionLabel={option => {
                            const isAdded = tokens.find(t => t.symbol === option.symbol);
                            if (isAdded) {
                                return `${option.name} (${props.intl.formatMessage(
                                    l10nSummaryMessages.TR_ALREADY_USED
                                )})`;
                            }
                            return option.name;
                        }}
                        getOptionLabel={option => option.name}
                        getOptionValue={option => option.symbol}
                    />
                </AsyncSelectWrapper>
                <AddedTokensWrapper>
                    {tokens.length < 1 && <AddTokenMessage />}
                    {tokens.map(token => (
                        <AddedToken
                            key={token.symbol}
                            token={token}
                            pending={pending}
                            removeToken={props.removeToken}
                            hideBalance={props.wallet.hideBalance}
                        />
                    ))}
                </AddedTokensWrapper>
            </React.Fragment>
        </Content>
    );
};

export default AccountSummary;
