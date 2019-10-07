import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Link, variables } from '@trezor/components';
import AccountName from '@wallet-components/AccountName';
import l10nSummaryMessages from '../../common.messages';
import AccountBalance from './components/Balance';
import { Account, Network, Fiat } from '@wallet-types';

const { FONT_SIZE } = variables;

const AccountHeading = styled.div`
    padding-bottom: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const StyledLink = styled(Link)`
    font-size: ${FONT_SIZE.SMALL};
`;

interface Props {
    account: Account;
    network: Network;
    localCurrency: string;
    isHidden: boolean;
    fiatRates: Fiat[];
}

const AccountHeader = ({ account, network, fiatRates, localCurrency, isHidden }: Props) => {
    const explorerLink = `${network.explorer.account}${account.descriptor}`;
    const balance = account.formattedBalance;
    const reserve =
        account.networkType === 'ripple' && !account.empty && account.misc && account.misc.reserve
            ? account.misc.reserve
            : '0';
    return (
        <>
            <AccountHeading>
                <AccountName account={account} />
                <StyledLink href={explorerLink} isGray>
                    <FormattedMessage {...l10nSummaryMessages.TR_SEE_FULL_TRANSACTION_HISTORY} />
                </StyledLink>
            </AccountHeading>
            <AccountBalance
                network={network}
                balance={balance}
                fiat={fiatRates}
                localCurrency={localCurrency}
                isHidden={isHidden}
                xrpReserve={reserve}
            />
        </>
    );
};

export default AccountHeader;
