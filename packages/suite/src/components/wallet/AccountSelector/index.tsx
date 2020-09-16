import React from 'react';
import styled from 'styled-components';
import { Select, colors, variables } from '@trezor/components';
import { Account } from '@wallet-types';
import { HiddenPlaceholder, Translation } from '@suite-components';
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
    min-width: 310px;
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const OptionVal = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
`;

interface SelectValue {
    value: number;
    label: string;
    symbol: Account['symbol'];
    accountType: Account['accountType'];
}

const getOptions = (otherAccounts: Account[]) => {
    const options: SelectValue[] = [];
    otherAccounts.forEach(account => {
        const { index, symbol, accountType } = account;
        options.push({
            label: `${symbol.toUpperCase()} Account #${index + 1} ${
                accountType !== 'normal' ? accountType : ''
            }`,
            value: index,
            symbol,
            accountType,
        });
    });

    return options;
};

const AccountSelector = ({ accounts, selectedAccount, title, goto, router }: Props) => {
    if (selectedAccount.status !== 'loaded' || !router.route) return null;
    const { account } = selectedAccount;

    const otherAccounts = accounts.filter(
        (otherAccount: Account) => account.symbol === otherAccount.symbol && otherAccount.visible,
    );
    const options = getOptions(otherAccounts);
    const accountValue = options.find(
        option => option.value === account.index && option.accountType === account.accountType,
    );

    return (
        <Wrapper>
            <Title>{title}</Title>
            <SelectWrapper>
                {otherAccounts.length === 1 && (
                    <SingleAccount>
                        Account {account.symbol.toUpperCase()} #{account.index + 1}
                        <Label>
                            <HiddenPlaceholder>
                                {account.formattedBalance} {account.symbol.toUpperCase()}
                            </HiddenPlaceholder>
                        </Label>
                    </SingleAccount>
                )}
                {otherAccounts.length > 1 && (
                    <Select
                        isClean
                        onChange={(change: SelectValue) => {
                            const { symbol, accountType, value } = change;
                            goto(router.route.name, {
                                accountIndex: value,
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
                                        <OptionVal>{option.label}</OptionVal>
                                        <HiddenPlaceholder>
                                            <Label>
                                                {itemAccount.formattedBalance}{' '}
                                                {itemAccount.symbol.toUpperCase()}
                                            </Label>
                                        </HiddenPlaceholder>
                                    </Option>
                                );
                            }
                        }}
                        options={options}
                        value={accountValue}
                        variant="small"
                        noOptionsMessage={() => <Translation id="TR_NO_ACCOUNT_FOUND" />}
                    />
                )}
            </SelectWrapper>
        </Wrapper>
    );
};

export default AccountSelector;
