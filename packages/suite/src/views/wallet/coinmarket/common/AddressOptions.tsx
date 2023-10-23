import { useEffect, ReactElement } from 'react';
import { UseFormReturn, Control, Controller } from 'react-hook-form';
import type { MenuPlacement } from 'react-select';
import styled from 'styled-components';

import type { AccountAddress } from '@trezor/connect';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { variables, Select } from '@trezor/components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import type { Account } from 'src/types/wallet';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { AddressOptionsFormState } from 'src/types/wallet/coinmarketBuyOffers';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';

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
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
        label: ReactElement;
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

interface AddressOptionsProps<TFieldValues extends AddressOptionsFormState>
    extends Pick<UseFormReturn<TFieldValues>, 'setValue'> {
    control: Control<TFieldValues>;
    receiveSymbol?: string;
    account?: Account;
    address?: string;
    menuPlacement?: MenuPlacement;
}
export const AddressOptions = <TFieldValues extends AddressOptionsFormState>({
    receiveSymbol,
    address,
    account,
    menuPlacement,
    ...props
}: AddressOptionsProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { control, setValue } = props as unknown as UseFormReturn<AddressOptionsFormState>;

    const addresses = account?.addresses;
    const addressDictionary = useAccountAddressDictionary(account);
    const value = address ? addressDictionary[address] : undefined;
    const accountMetadata = useSelector(state =>
        selectLabelingDataForAccount(state, account?.key || ''),
    );

    useEffect(() => {
        if (!address && addresses) {
            setValue('address', addresses.unused[0].address);
        }
    }, [address, addresses, setValue]);

    return (
        <Controller
            control={control}
            name="address"
            render={({ field: { onChange } }) => (
                <Select
                    onChange={({ address }) => onChange(address)}
                    isClearable={false}
                    value={value}
                    options={buildOptions(addresses)}
                    minValueWidth="70px"
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
                                    <Address>
                                        {accountMetadata.addressLabels[accountAddress.address] ||
                                            accountAddress.address}
                                    </Address>
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
