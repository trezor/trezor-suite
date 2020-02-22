import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { CoinLogo, variables } from '@trezor/components';
import messages from '@suite/support/messages';
import { ExtendedMessageDescriptor } from '@suite-types';
import Title from '@wallet-components/Title';
import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const AccountTitle = styled.div`
    font-size: ${FONT_SIZE.H1};
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

const Label = styled.span`
    text-transform: uppercase;
    margin-left: 5px;
`;

const LabelAddon = styled.span`
    margin-right: 2px;
`;

interface Props {
    account: Account;
    message?: ExtendedMessageDescriptor;
}

const AccountName = ({ account, message }: Props) => {
    const accountType = getTypeForNetwork(account.accountType);
    return (
        <Title>
            <StyledCoinLogo size={24} symbol={account.symbol} />
            <AccountTitle>
                {message && (
                    <Translation
                        {...message}
                        values={{
                            network: <Translation {...getTitleForNetwork(account.symbol)} />,
                        }}
                    />
                )}
                {!message && <Translation {...getTitleForNetwork(account.symbol)} />}
                <Label>
                    {accountType && (
                        <LabelAddon>
                            <Translation {...accountType} />
                        </LabelAddon>
                    )}
                    <Translation
                        {...(account.imported
                            ? messages.TR_IMPORTED_ACCOUNT_HASH
                            : messages.TR_ACCOUNT_HASH)}
                        values={{ number: String(account.index + 1) }}
                    />
                </Label>
            </AccountTitle>
        </Title>
    );
};

export default AccountName;
