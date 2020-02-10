import React from 'react';
import styled from 'styled-components';
import { Select, colors, variables } from '@trezor/components-v2';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    border-radius: 6px;
    border: 1px solid ${colors.BLACK96};
    margin-bottom: 10px;
    max-height: 70px;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.BLACK50};
    text-indent: 1ch;
`;

const SingleAccount = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const SelectWrapper = styled.div`
    min-width: 250px;
`;

interface SelectValue {
    value: number;
    label: string;
}

interface Props {
    title: string;
    selectedAccount: Account;
    accounts: Account[];
    goto: any; // todo fix ts
}

const getOptions = (otherAccounts: Account[]) => {
    const options: SelectValue[] = [];
    otherAccounts.forEach(account => {
        const { index, symbol } = account;
        options.push({
            label: `${symbol.toUpperCase()} Account #${index + 1}`,
            value: index,
        });
    });

    return options;
};

export default ({ accounts, selectedAccount, title, goto }: Props) => {
    const otherAccounts = accounts.filter(
        otherAccount => selectedAccount.symbol === otherAccount.symbol && otherAccount.visible,
    );
    const options = getOptions(otherAccounts);
    const selectedAccountValue = options.find(option => option.value === selectedAccount.index);

    return (
        <Wrapper>
            <Title>{title}</Title>
            <SelectWrapper>
                {otherAccounts.length === 1 && (
                    <SingleAccount>
                        Account {selectedAccount.symbol.toUpperCase()} #{selectedAccount.index + 1}
                        <Label>
                            {selectedAccount.formattedBalance}{' '}
                            {selectedAccount.symbol.toUpperCase()}
                        </Label>
                    </SingleAccount>
                )}
                {otherAccounts.length > 1 && (
                    <Select
                        clean
                        onChange={(change: SelectValue) => {
                            const { symbol, accountType } = selectedAccount;
                            goto('wallet-send', {
                                accountIndex: change.value,
                                symbol,
                                accountType,
                            });
                        }}
                        option
                        options={options}
                        value={selectedAccountValue}
                        variant="small"
                    />
                )}
            </SelectWrapper>
        </Wrapper>
    );
};
