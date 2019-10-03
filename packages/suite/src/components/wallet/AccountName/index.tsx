import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { CoinLogo, variables } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { Account, Network } from '@wallet-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const AccountTitle = styled.div`
    font-size: ${FONT_SIZE.WALLET_TITLE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

interface Props {
    account: Account;
    network: Network;
    message?: ReactIntl.FormattedMessage;
}

const AccountName = ({ account, network, message }: Props) => {
    return (
        <Wrapper>
            <StyledCoinLogo size={24} symbol={account.symbol} />
            <AccountTitle>
                {message && (
                    <FormattedMessage
                        {...message}
                        values={{
                            network: getTitleForNetwork(network.symbol, intl),
                        }}
                    />
                )}
                {!message && <>{getTitleForNetwork(account.symbol, intl)}</>}
                <FormattedMessage
                    {...(account.imported
                        ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                        : l10nCommonMessages.TR_ACCOUNT_HASH)}
                    values={{ number: String(account.index + 1) }}
                />
            </AccountTitle>
        </Wrapper>
    );
};

export default AccountName;
