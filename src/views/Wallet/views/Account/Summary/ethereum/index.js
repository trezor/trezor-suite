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

import CoinLogo from 'components/images/CoinLogo';
import * as stateUtils from 'reducers/utils';
import Link from 'components/Link';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';
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
                        <AccountTitle>Account #{parseInt(account.index, 10) + 1}</AccountTitle>
                    </AccountName>
                    <Link href={explorerLink} isGray>See full transaction history</Link>
                </AccountHeading>
                <AccountBalance
                    network={network}
                    balance={balance}
                    fiat={props.fiat}
                />
                <H2Wrapper>
                    <H2>Tokens</H2>
                    <StyledTooltip
                        maxWidth={200}
                        placement="top"
                        content="Insert token name, symbol or address to be able to send it."
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
                        placeholder="Type in a token name or a token address"
                        loadingMessage={() => 'Loading...'}
                        noOptionsMessage={() => 'Token not found'}
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
                                return `${option.name} (Already added)`;
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