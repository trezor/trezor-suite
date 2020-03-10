import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { CoinLogo, H2 } from '@trezor/components';

import { ExtendedMessageDescriptor } from '@suite-types';
import Title from '@wallet-components/Title';
import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

const StyledH2 = styled(H2)`
    display: flex;
    align-items: center;
    padding-top: 15px;
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
            <StyledH2>
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
            </StyledH2>
        </Title>
    );
};

export default AccountName;
