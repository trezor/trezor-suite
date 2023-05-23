import React, { useEffect } from 'react';
import styled from 'styled-components';
import type { AccountAddress } from '@trezor/connect';
import { Translation, FiatValue, FormattedCryptoAmount } from '@suite-components';
import { variables, Select } from '@trezor/components';
import { UseFormMethods, Control, Controller } from 'react-hook-form';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import type { Account } from '@wallet-types';
import { useAccountAddressDictionary } from '@wallet-hooks/useAccounts';
import type { MenuPlacement } from 'react-select';

const AddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const PathWrapper = styled.div`
    padding: 0 3px;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Address = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const CryptoWrapper = styled.div`
    padding-right: 3px;
`;

const buildOptions = (addresses: Account['addresses']) => {
    if (!addresses) return undefined;

    interface Options {
        label: React.ReactElement;
        options: AccountAddress[];
    }

    const unused: Options = {
        label: <Translation id="RECEIVE_TABLE_NOT_USED" />,
        options: addresses.unused,
    };

    const used: Options = {
        label: <Translation id="RECEIVE_TABLE_USED" />,
        options: addresses.used,
    };

    return [unused, used];
};

type FormState = {
    address?: string;
};

interface Props extends Pick<UseFormMethods<FormState>, 'setValue'> {
    control: Control;
    receiveSymbol?: string;
    account?: Account;
    address?: string;
    menuPlacement?: MenuPlacement;
}
export const AddressOptions = ({
    control,
    receiveSymbol,
    setValue,
    address,
    account,
    menuPlacement,
}: Props) => {
    const addresses = account?.addresses;
    const addressDictionary = useAccountAddressDictionary(account);
    const value = address ? addressDictionary[address] : null;

    const handleChange = (accountAddress: AccountAddress) =>
        setValue('address', accountAddress.address);

    useEffect(() => {
        if (!address && addresses) {
            setValue('address', addresses.unused[0].address);
        }
    }, [address, addresses, setValue]);

    return (
        <Controller
            control={control}
            name="address"
            defaultValue={value}
            render={({ ref, ...field }) => (
                <Select
                    {...field}
                    onChange={handleChange}
                    isClearable={false}
                    value={value}
                    options={buildOptions(addresses)}
                    minWidth="70px"
                    menuPlacement={menuPlacement}
                    formatOptionLabel={(accountAddress: AccountAddress) => {
                        if (!accountAddress) return null;
                        const formattedCryptoAmount = formatNetworkAmount(
                            accountAddress.balance || '0',
                            receiveSymbol as Account['symbol'],
                        );
                        return (
                            <Option>
                                <AddressWrapper>
                                    <Address>{accountAddress.address}</Address>
                                    <Amount>
                                        <CryptoWrapper>
                                            <FormattedCryptoAmount
                                                value={formattedCryptoAmount}
                                                symbol={receiveSymbol}
                                            />
                                        </CryptoWrapper>
                                        • <PathWrapper>{accountAddress.path}</PathWrapper> •
                                        <FiatWrapper>
                                            <FiatValue
                                                amount={formattedCryptoAmount}
                                                symbol={receiveSymbol || ''}
                                            />
                                        </FiatWrapper>
                                    </Amount>
                                </AddressWrapper>
                            </Option>
                        );
                    }}
                />
            )}
        />
    );
};
