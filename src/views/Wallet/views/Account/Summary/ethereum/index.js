/* @flow */
import styled from 'styled-components';
import React from 'react';
import { H2 } from 'components/Heading';
import BigNumber from 'bignumber.js';
import Icon from 'components/Icon';
import { AsyncSelect } from 'components/Select';
import ICONS from 'config/icons';
import colors from 'config/colors';
import Tooltip from 'components/Tooltip';
import Content from 'views/Wallet/components/Content';
import { FormattedMessage } from 'react-intl';

import l10nCommonMessages from 'views/common.messages';
import CoinLogo from 'components/images/CoinLogo';
import * as stateUtils from 'reducers/utils';
import Link from 'components/Link';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';
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

const H2Wrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 20px 0;
`;

const StyledTooltip = styled(Tooltip)`
    position: relative;
    top: 2px;
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
    position: relative;
    top: -7px;
    
    &:hover {
        cursor: pointer;
    }
`;

const AsyncSelectWrapper = styled.div`
    padding-bottom: 32px;
`;

const AddedTokensWrapper = styled.div``;

const AccountSummary = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        network,
        tokens,
        pending,
        shouldRender,
    } = props.selectedAccount;

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
                        <CoinLogo network={account.network} />
                        <AccountTitle>
                            <FormattedMessage
                                {...l10nCommonMessages.TR_ACCOUNT_HASH}
                                values={{ number: parseInt(account.index, 10) + 1 }}
                            />
                        </AccountTitle>
                    </AccountName>
                    <Link href={explorerLink} isGray>
                        <FormattedMessage {...l10nSummaryMessages.TR_SEE_FULL_TRANSACTION_HISTORY} />
                    </Link>
                </AccountHeading>
                <AccountBalance
                    network={network}
                    balance={balance}
                    fiat={props.fiat}
                />
                <H2Wrapper>
                    <H2>
                        <FormattedMessage {...l10nSummaryMessages.TR_TOKENS} />
                    </H2>
                    <StyledTooltip
                        maxWidth={200}
                        placement="top"
                        content={props.intl.formatMessage(l10nSummaryMessages.TR_INSERT_TOKEN_NAME)}
                    >
                        <StyledIcon
                            icon={ICONS.HELP}
                            color={colors.TEXT_SECONDARY}
                            size={24}
                        />
                    </StyledTooltip>
                </H2Wrapper>
                <AsyncSelectWrapper>
                    <AsyncSelect
                        isSearchable
                        defaultOptions
                        value={null}
                        isMulti={false}
                        placeholder={props.intl.formatMessage(l10nSummaryMessages.TR_TYPE_IN_A_TOKEN_NAME)}
                        loadingMessage={() => props.intl.formatMessage(l10nCommonMessages.TR_LOADING_DOT_DOT_DOT)}
                        noOptionsMessage={() => props.intl.formatMessage(l10nSummaryMessages.TR_TOKEN_NOT_FOUND)}
                        onChange={(token) => {
                            if (token.name) {
                                const isAdded = tokens.find(t => t.symbol === token.symbol);
                                if (!isAdded) {
                                    props.addToken(token, account);
                                }
                            }
                        }}
                        loadOptions={input => props.loadTokens(input, account.network)}
                        formatOptionLabel={(option) => {
                            const isAdded = tokens.find(t => t.symbol === option.symbol);
                            if (isAdded) {
                                return `${option.name} (${props.intl.formatMessage(l10nSummaryMessages.TR_ALREADY_USED)})`;
                            }
                            return option.name;
                        }}
                        getOptionLabel={option => option.name}
                        getOptionValue={option => option.symbol}
                    />
                </AsyncSelectWrapper>
                <AddedTokensWrapper>
                    { tokens.length < 1 && (<AddTokenMessage />) }
                    {tokens.map(token => (
                        <AddedToken
                            key={token.symbol}
                            token={token}
                            pending={pending}
                            removeToken={props.removeToken}
                        />
                    ))}
                </AddedTokensWrapper>
            </React.Fragment>
        </Content>
    );
};

export default AccountSummary;