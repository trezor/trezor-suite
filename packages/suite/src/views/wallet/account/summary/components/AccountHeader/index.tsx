import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { CoinLogo, Link, variables } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import l10nSummaryMessages from '../../common.messages';
import AccountBalance from './components/Balance';
import { Account, Network, Fiat } from '@wallet-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const AccountHeading = styled.div`
    padding-bottom: 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const AccountName = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const AccountTitle = styled.div`
    font-size: ${FONT_SIZE.WALLET_TITLE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const StyledLink = styled(Link)`
    font-size: ${FONT_SIZE.SMALL};
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
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
                <AccountName>
                    <StyledCoinLogo size={24} symbol={account.symbol} />
                    <AccountTitle>
                        <FormattedMessage
                            {...(account.imported
                                ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                                : l10nCommonMessages.TR_ACCOUNT_HASH)}
                            values={{ number: String(account.index + 1) }}
                        />
                    </AccountTitle>
                </AccountName>
                <StyledLink href={explorerLink} variant="gray">
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
