/* @flow */
import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { FormattedMessage } from 'react-intl';
import * as stateUtils from 'reducers/utils';

import { CoinLogo, H5, Link, colors } from 'trezor-ui-components';
import Content from 'views/Wallet/components/Content';
import { FONT_WEIGHT, FONT_SIZE } from 'config/variables';

import l10nCommonMessages from 'views/common.messages';
import l10nSummaryMessages from '../common.messages';
import AccountBalance from './components/Balance';

import type { Props } from './Container';

const AccountHeading = styled.div`
    padding-bottom: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const HeadingWrapper = styled.div`
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

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

const StyledLink = styled(Link)`
    font-size: ${FONT_SIZE.SMALL};
`;

const AccountSummary = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const { account, network, pending, shouldRender } = props.selectedAccount;

    if (!device || !account || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    const explorerLink: string = `${network.explorer.address}${account.descriptor}`;
    const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, network.symbol);
    const balance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);
    const reserve: string =
        account.networkType === 'ripple' && !account.empty ? account.reserve : '0';

    const TMP_SHOW_HISTORY = false;

    return (
        <Content>
            <React.Fragment>
                <AccountHeading>
                    <AccountName>
                        <StyledCoinLogo height={23} network={account.network} />
                        <AccountTitle>
                            <FormattedMessage
                                {...(account.imported
                                    ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                                    : l10nCommonMessages.TR_ACCOUNT_HASH)}
                                values={{ number: parseInt(account.index, 10) + 1 }}
                            />
                        </AccountTitle>
                    </AccountName>
                    {!account.empty && (
                        <StyledLink href={explorerLink} isGray>
                            <FormattedMessage
                                {...l10nSummaryMessages.TR_SEE_FULL_TRANSACTION_HISTORY}
                            />
                        </StyledLink>
                    )}
                </AccountHeading>
                <AccountBalance
                    network={network}
                    balance={balance}
                    reserve={reserve}
                    fiat={props.fiat}
                    localCurrency={props.wallet.localCurrency}
                    isHidden={props.wallet.hideBalance}
                />
                {TMP_SHOW_HISTORY && (
                    <HeadingWrapper>
                        <H5>
                            <FormattedMessage {...l10nSummaryMessages.TR_HISTORY} />
                        </H5>
                    </HeadingWrapper>
                )}
            </React.Fragment>
        </Content>
    );
};

export default AccountSummary;
