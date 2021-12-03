import React, { useState } from 'react';
import styled from 'styled-components';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import { variables, CoinLogo, Select, Icon, useTheme } from '@trezor/components';
import { FiatValue, Translation, HiddenPlaceholder, AccountLabeling } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';
import { getUnusedAddressFromAccount } from '@wallet-utils/coinmarket/coinmarketUtils';
import type { UseFormMethods } from 'react-hook-form';
import type { Account } from '@wallet-types';

const LogoWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 3px;
`;

const AccountWrapper = styled.div`
    display: flex;
    padding: 0 0 0 15px;
    flex-direction: column;
`;

const UpperCase = styled.div`
    text-transform: uppercase;
    padding: 0 3px;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const AccountType = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding-left: 5px;
`;

export type AccountSelectOption = {
    type: 'SUITE' | 'ADD_SUITE' | 'NON_SUITE';
    account?: Account;
};

type FormState = {
    address?: string;
};

type Props = Pick<UseFormMethods<FormState>, 'setValue'> & {
    selectedAccountOption?: AccountSelectOption;
    setSelectedAccountOption: (o: AccountSelectOption) => void;
};

const ReceiveOptions = (props: Props) => {
    const theme = useTheme();
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    const { device, suiteReceiveAccounts, receiveSymbol, setReceiveAccount } =
        useCoinmarketExchangeOffersContext();
    const [menuIsOpen, setMenuIsOpen] = useState<boolean | undefined>(undefined);

    const { selectedAccountOption, setSelectedAccountOption, setValue } = props;

    const selectAccountOptions: AccountSelectOption[] = [];

    if (suiteReceiveAccounts) {
        suiteReceiveAccounts.forEach(account => {
            selectAccountOptions.push({ type: 'SUITE', account });
        });
        selectAccountOptions.push({ type: 'ADD_SUITE' });
    }
    selectAccountOptions.push({ type: 'NON_SUITE' });

    const selectAccountOption = (option: AccountSelectOption) => {
        setSelectedAccountOption(option);
        setReceiveAccount(option.account);
        if (option.account) {
            const { address } = getUnusedAddressFromAccount(option.account);
            setValue('address', address, { shouldValidate: true });
        } else {
            setValue('address', '', { shouldValidate: false });
        }
    };

    const onChangeAccount = (account: AccountSelectOption) => {
        if (account.type === 'ADD_SUITE') {
            if (device) {
                setMenuIsOpen(true);
                openModal({
                    type: 'add-account',
                    device: device!,
                    symbol: receiveSymbol as Account['symbol'],
                    noRedirect: true,
                });
            }
        } else {
            selectAccountOption(account);
            setMenuIsOpen(undefined);
        }
    };

    // preselect the account after everything is loaded
    useTimeoutFn(() => {
        if (selectAccountOptions.length > 0 && selectAccountOptions[0].type !== 'ADD_SUITE') {
            selectAccountOption(selectAccountOptions[0]);
        }
    }, 100);

    return (
        <Select
            onChange={(selected: any) => {
                onChangeAccount(selected);
            }}
            noTopLabel
            value={selectedAccountOption}
            isClearable={false}
            options={selectAccountOptions}
            minWidth="70px"
            formatOptionLabel={(option: AccountSelectOption) => {
                switch (option.type) {
                    case 'SUITE': {
                        if (!option.account) return null;
                        const { symbol, formattedBalance } = option.account;
                        return (
                            <Option>
                                <LogoWrapper>
                                    <CoinLogo size={25} symbol={symbol} />
                                </LogoWrapper>
                                <AccountWrapper>
                                    <AccountName>
                                        <AccountLabeling account={option.account} />
                                        <AccountType>
                                            {option.account.accountType !== 'normal'
                                                ? option.account.accountType
                                                : ''}
                                        </AccountType>
                                    </AccountName>
                                    <Amount>
                                        <HiddenPlaceholder>{formattedBalance}</HiddenPlaceholder>{' '}
                                        <UpperCase>{symbol}</UpperCase> •
                                        <FiatWrapper>
                                            <FiatValue amount={formattedBalance} symbol={symbol} />
                                        </FiatWrapper>
                                    </Amount>
                                </AccountWrapper>
                            </Option>
                        );
                    }
                    case 'ADD_SUITE':
                        return (
                            <Option>
                                <LogoWrapper>
                                    <Icon icon="PLUS" size={25} color={theme.TYPE_DARK_GREY} />
                                </LogoWrapper>
                                <AccountWrapper>
                                    <Translation
                                        id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                                        values={{
                                            symbol: receiveSymbol?.toUpperCase(),
                                        }}
                                    />
                                </AccountWrapper>
                            </Option>
                        );
                    case 'NON_SUITE':
                        return (
                            <Option>
                                <LogoWrapper>
                                    <Icon icon="NON_SUITE" size={25} color={theme.TYPE_DARK_GREY} />
                                </LogoWrapper>
                                <AccountWrapper>
                                    <Translation
                                        id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                                        values={{
                                            symbol: receiveSymbol?.toUpperCase(),
                                        }}
                                    />
                                </AccountWrapper>
                            </Option>
                        );
                    default:
                        return null;
                }
            }}
            isDropdownVisible={selectAccountOptions.length === 1}
            isDisabled={selectAccountOptions.length === 1}
            placeholder={
                <Translation
                    id="TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT"
                    values={{ symbol: receiveSymbol?.toUpperCase() }}
                />
            }
            menuIsOpen={menuIsOpen}
        />
    );
};

export default ReceiveOptions;
