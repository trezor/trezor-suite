import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { variables } from '@trezor/components';
import { Link } from '@trezor/components-v2';
import AccountName from '@wallet-components/AccountName';
import l10nSummaryMessages from '../../common.messages';
import AccountBalance from './components/Balance';
import { Account, Network, Fiat } from '@wallet-types';

const { FONT_SIZE } = variables;

const AccountHeading = styled.div`
    padding-bottom: 35px;
    display: flex;
    justify-content: space-between;
    align-items: end;
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
    const accountNameMessage =
        account && account.networkType === 'ethereum'
            ? l10nSummaryMessages.TR_NETWORK_AND_TOKENS
            : undefined;
    return (
        <>
            <AccountHeading>
                <AccountName account={account} message={accountNameMessage} />
                <StyledLink href={explorerLink}>
                    <Translation {...l10nSummaryMessages.TR_SEE_FULL_TRANSACTION_HISTORY} />
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
