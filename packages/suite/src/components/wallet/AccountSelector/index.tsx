import React from 'react';
import styled from 'styled-components';
import { Select, colors, variables } from '@trezor/components-v2';
import { Account } from '@wallet-types';
import { Props } from './Container';

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

const Option = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

interface SelectValue {
    value: number;
    label: string;
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

export default ({ accounts, selectedAccount, title, goto, router }: Props) => {
    if (selectedAccount.status !== 'loaded' || !router.route) return null;
    const { account } = selectedAccount;

    const otherAccounts = accounts.filter(
        (otherAccount: Account) => account.symbol === otherAccount.symbol && otherAccount.visible,
    );
    const options = getOptions(otherAccounts);
    const accountValue = options.find(option => option.value === account.index);

    return (
        <Wrapper>
            <Title>{title}</Title>
            <SelectWrapper>
                {otherAccounts.length === 1 && (
                    <SingleAccount>
                        Account {account.symbol.toUpperCase()} #{account.index + 1}
                        <Label>
                            {account.formattedBalance} {account.symbol.toUpperCase()}
                        </Label>
                    </SingleAccount>
                )}
                {otherAccounts.length > 1 && (
                    <Select
                        isClean
                        onChange={(change: SelectValue) => {
                            const { symbol, accountType } = account;
                            goto(router.route.name, {
                                accountIndex: change.value,
                                symbol,
                                accountType,
                            });
                        }}
                        formatOptionLabel={(option: SelectValue) => {
                            const itemAccount = otherAccounts.find(
                                account => account.index === option.value,
                            );
                            if (itemAccount) {
                                return (
                                    <Option>
                                        {option.label}
                                        <Label>
                                            {itemAccount.formattedBalance}{' '}
                                            {itemAccount.symbol.toUpperCase()}
                                        </Label>
                                    </Option>
                                );
                            }
                        }}
                        options={options}
                        value={accountValue}
                        variant="small"
                    />
                )}
            </SelectWrapper>
        </Wrapper>
    );
};
