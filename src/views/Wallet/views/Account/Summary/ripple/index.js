/* @flow */
import styled from 'styled-components';
import React from 'react';
import { H2 } from 'components/Heading';
import BigNumber from 'bignumber.js';
import colors from 'config/colors';
import Content from 'views/Wallet/components/Content';
import { FormattedMessage } from 'react-intl';
import l10nCommonMessages from 'views/common.messages';

import CoinLogo from 'components/images/CoinLogo';
import * as stateUtils from 'reducers/utils';
import Link from 'components/Link';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';
import l10nSummaryMessages from '../common.messages';
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
                        <AccountTitle>
                            <FormattedMessage
                                {...l10nCommonMessages.TR_ACCOUNT_HASH}
                                values={{ number: parseInt(account.index, 10) + 1 }}
                            />
                        </AccountTitle>
                    </AccountName>
                    { !account.empty && (
                        <Link href={explorerLink} isGray>
                            <FormattedMessage {...l10nSummaryMessages.TR_SEE_FULL_TRANSACTION_HISTORY} />
                        </Link>
                    ) }
                </AccountHeading>
                <AccountBalance
                    network={network}
                    balance={balance}
                    reserve={reserve}
                    fiat={props.fiat}
                />
                { TMP_SHOW_HISTORY && (
                    <H2Wrapper>
                        <H2><FormattedMessage {...l10nSummaryMessages.TR_HISTORY} /></H2>
                    </H2Wrapper>
                )
                }
            </React.Fragment>
        </Content>
    );
};

export default AccountSummary;