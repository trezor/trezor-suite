/* @flow */
import styled from 'styled-components';
import React from 'react';
import { H2 } from 'components/Heading';
import BigNumber from 'bignumber.js';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import colors from 'config/colors';
import Tooltip from 'components/Tooltip';
import Content from 'views/Wallet/components/Content';

import CoinLogo from 'components/images/CoinLogo';
import * as stateUtils from 'reducers/utils';
import Link from 'components/Link';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';
import AccountBalance from './components/Balance';

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

const AccountSummary = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        network,
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
    const reserve: string = account.networkType === 'ripple' && !account.empty ? account.reserve : '0';

    const TMP_SHOW_HISTORY = false;

    return (
        <Content>
            <React.Fragment>
                <AccountHeading>
                    <AccountName>
                        <CoinLogo network={account.network} />
                        <AccountTitle>Account #{parseInt(account.index, 10) + 1}</AccountTitle>
                    </AccountName>
                    { !account.empty && <Link href={explorerLink} isGray>See full transaction history</Link> }
                </AccountHeading>
                <AccountBalance
                    network={network}
                    balance={balance}
                    reserve={reserve}
                    fiat={props.fiat}
                />
                { TMP_SHOW_HISTORY && (
                    <H2Wrapper>
                        <H2>History</H2>
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
                    </H2Wrapper>)
                }
            </React.Fragment>
        </Content>
    );
};

export default AccountSummary;