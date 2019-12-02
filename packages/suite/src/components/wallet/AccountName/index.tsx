import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { CoinLogo, variables, colors } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import { ExtendedMessageDescriptor } from '@suite/types/suite';
import Title from '@wallet-components/Title';
import { getTitleForNetwork, getTypeForNetwork } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const AccountTitle = styled.div`
    font-size: ${FONT_SIZE.WALLET_TITLE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

const Label = styled.span`
    font-size: ${variables.FONT_SIZE.BASE};
    font-weight: ${variables.FONT_WEIGHT.NORMAL};
    text-transform: uppercase;
    color: ${colors.TEXT_SECONDARY};
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
                            ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                            : l10nCommonMessages.TR_ACCOUNT_HASH)}
                        values={{ number: String(account.index + 1) }}
                    />
                </Label>
            </AccountTitle>
        </Title>
    );
};

export default AccountName;
