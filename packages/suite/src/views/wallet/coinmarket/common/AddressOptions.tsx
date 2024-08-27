import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { CryptoId } from 'invity-api';
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
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';
import { CoinmarketBuyAddressOptionsType } from 'src/types/coinmarket/coinmarketOffers';
import { useCoinmarketInfo } from '../../../../hooks/wallet/coinmarket/useCoinmarketInfo';

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
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
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

interface AddressOptionsProps<TFieldValues extends CoinmarketBuyAddressOptionsType>
    extends Pick<UseFormReturn<TFieldValues>, 'setValue'> {
    control: Control<TFieldValues>;
    receiveCryptoId?: CryptoId;
    account?: Account;
    address?: string;
    menuPlacement?: MenuPlacement;
}
export const AddressOptions = <TFieldValues extends CoinmarketBuyAddressOptionsType>({
    receiveCryptoId,
    address,
    account,
    menuPlacement,
    ...props
}: AddressOptionsProps<TFieldValues>) => {
    const { getNetworkSymbol } = useCoinmarketInfo();

    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { control, setValue } =
        props as unknown as UseFormReturn<CoinmarketBuyAddressOptionsType>;

    const addresses = account?.addresses;
    const addressDictionary = useAccountAddressDictionary(account);
    const value = address ? addressDictionary[address] : undefined;
    const accountMetadata = useSelector(state =>
        selectLabelingDataForAccount(state, account?.key || ''),
    );
    // TODO: How do we handle unsupported shitcoins?
    const symbol = getNetworkByCoingeckoId(receiveCryptoId as string)?.symbol || 'btc';

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
                            symbol,
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
                                                symbol={getNetworkSymbol(
                                                    receiveCryptoId as CryptoId,
                                                )}
                                            />
                                        </CryptoWrapper>
                                        • <PathWrapper>{accountAddress.path}</PathWrapper> •
                                        <FiatWrapper>
                                            <FiatValue
                                                amount={formattedCryptoAmount}
                                                symbol={symbol}
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
