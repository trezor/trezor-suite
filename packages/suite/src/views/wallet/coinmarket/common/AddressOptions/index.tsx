import React, { useEffect } from 'react';
import styled from 'styled-components';
import type { AccountAddress } from 'trezor-connect';
import { Translation, HiddenPlaceholder, FiatValue } from '@suite-components';
import { variables, Select } from '@trezor/components';
import { UseFormMethods, Control, Controller } from 'react-hook-form';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import type { Account } from '@wallet-types';
import { useAccountAddressDictionary } from '@wallet-hooks/useAccounts';

const AddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const PathWrapper = styled.div`
    padding: 0 3px 0 3px;
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

const UpperCase = styled.div`
    text-transform: uppercase;
    padding: 0 3px;
`;

const buildOptions = (addresses: Account['addresses']) => {
    if (!addresses) return null;

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
}
const AddressOptions = (props: Props) => {
    const { control, receiveSymbol, setValue, address, account } = props;
    const addresses = account?.addresses;
    const addressDictionary = useAccountAddressDictionary(account);

    useEffect(() => {
        if (!address && addresses) {
            setValue('address', addresses.unused[0].address);
        }
    }, [address, addresses, setValue]);

    return (
        <Controller
            control={control}
            name="address"
            defaultValue={addressDictionary && address && addressDictionary[address]}
            render={({ ref, ...field }) => (
                <>
                    <Select
                        {...field}
                        onChange={(accountAddress: AccountAddress) =>
                            setValue('address', accountAddress.address)
                        }
                        noTopLabel
                        isClearable={false}
                        value={addressDictionary && address && addressDictionary[address]}
                        options={buildOptions(addresses)}
                        minWidth="70px"
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
                                            <HiddenPlaceholder>
                                                {formattedCryptoAmount}
                                            </HiddenPlaceholder>{' '}
                                            <UpperCase>{receiveSymbol}</UpperCase> •
                                            <PathWrapper>{accountAddress.path}</PathWrapper> •
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
                </>
            )}
        />
    );
};

export default AddressOptions;
