import { useEffect, ReactElement } from 'react';
import { UseFormReturn, Control, Controller } from 'react-hook-form';
import type { MenuPlacement } from 'react-select';
import styled from 'styled-components';

import type { AccountAddress } from '@trezor/connect';
import { Translation } from 'src/components/suite';
import { variables, Select } from '@trezor/components';
import type { Account } from 'src/types/wallet';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';
import { CoinmarketBuyAddressOptionsType } from 'src/types/coinmarket/coinmarketOffers';
import { CoinmarketBalance } from 'src/views/wallet/coinmarket/common/CoinmarketBalance';
import { spacingsPx, typography } from '@trezor/theme';
import { formatAmount } from '@suite-common/wallet-utils';
import { getNetworkDecimals } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { networks } from '@suite-common/wallet-config';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CryptoId } from 'invity-api';

const AddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Amount = styled.div`
    display: flex;
    gap: ${spacingsPx.xxs};
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
`;

const Address = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Option = styled.div`
    display: flex;
    align-items: center;
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

interface CoinmarketAddressOptionsProps<TFieldValues extends CoinmarketBuyAddressOptionsType>
    extends Pick<UseFormReturn<TFieldValues>, 'setValue'> {
    control: Control<TFieldValues>;
    receiveSymbol?: CryptoId;
    account?: Account;
    address?: string;
    menuPlacement?: MenuPlacement;
}

export const CoinmarketAddressOptions = <TFieldValues extends CoinmarketBuyAddressOptionsType>({
    receiveSymbol,
    address,
    account,
    menuPlacement,
    ...props
}: CoinmarketAddressOptionsProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { control, setValue } =
        props as unknown as UseFormReturn<CoinmarketBuyAddressOptionsType>;

    const addresses = account?.addresses;
    const addressDictionary = useAccountAddressDictionary(account);
    const value = address ? addressDictionary[address] : undefined;
    const accountMetadata = useSelector(state =>
        selectLabelingDataForAccount(state, account?.key || ''),
    );
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();

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
                        if (!accountAddress || !account || !receiveSymbol) return null;

                        const networkDecimals = getNetworkDecimals(
                            networks[account.symbol].decimals,
                        );
                        const balance = accountAddress.balance
                            ? formatAmount(accountAddress.balance, networkDecimals)
                            : accountAddress.balance;

                        return (
                            <Option>
                                <AddressWrapper>
                                    <Address data-testid="@coinmarket/form/verify/address">
                                        {accountMetadata.addressLabels[accountAddress.address] ||
                                            accountAddress.address}
                                    </Address>
                                    <Amount>
                                        <CoinmarketBalance
                                            balance={balance}
                                            cryptoSymbolLabel={cryptoIdToCoinSymbol(receiveSymbol)}
                                            networkSymbol={account.symbol}
                                        />
                                        <span>•</span>
                                        <span>{accountAddress.path}</span>
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
