import { useEffect, ReactElement, ReactNode } from 'react';
import { UseFormReturn, Control, Controller } from 'react-hook-form';
import type { MenuPlacement } from 'react-select';

import { CryptoId } from 'invity-api';

import type { AccountAddress } from '@trezor/connect';
import { Select, InfoSegments, Column } from '@trezor/components';
import { formatAmount } from '@suite-common/wallet-utils';
import { networks } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import type { Account } from 'src/types/wallet';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';
import { CoinmarketBalance } from 'src/views/wallet/coinmarket/common/CoinmarketBalance';
import { getCoinmarketNetworkDecimals } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { isCoinmarketExchangeContext } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { FORM_SEND_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/coinmarket/form';

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

type CoinmarketBuyAddressOptionsType = {
    address?: string;
};

interface CoinmarketAddressOptionsProps<TFieldValues extends CoinmarketBuyAddressOptionsType>
    extends Pick<UseFormReturn<TFieldValues>, 'setValue'> {
    control: Control<TFieldValues>;
    receiveSymbol?: CryptoId;
    account?: Account;
    address?: string;
    menuPlacement?: MenuPlacement;
    label: ReactNode;
}

export const CoinmarketAddressOptions = <TFieldValues extends CoinmarketBuyAddressOptionsType>({
    receiveSymbol,
    address,
    account,
    label,
    menuPlacement,
    ...props
}: CoinmarketAddressOptionsProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { control, setValue } =
        props as unknown as UseFormReturn<CoinmarketBuyAddressOptionsType>;
    const context = useCoinmarketFormContext();

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
                    labelLeft={label}
                    options={buildOptions(addresses)}
                    minValueWidth="70px"
                    menuPlacement={menuPlacement}
                    formatOptionLabel={(accountAddress: AccountAddress) => {
                        if (!accountAddress || !account || !receiveSymbol) return null;

                        const sendCryptoSelect = isCoinmarketExchangeContext(context)
                            ? context.getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT)
                            : undefined;

                        const networkDecimals = getCoinmarketNetworkDecimals({
                            sendCryptoSelect,
                            network: networks[account.symbol],
                        });
                        const balance = accountAddress.balance
                            ? formatAmount(accountAddress.balance, networkDecimals)
                            : accountAddress.balance;

                        return (
                            <Column>
                                <div data-testid="@coinmarket/form/verify/address">
                                    {accountMetadata.addressLabels[accountAddress.address] ||
                                        accountAddress.address}
                                </div>
                                <InfoSegments typographyStyle="label" variant="tertiary">
                                    <CoinmarketBalance
                                        balance={balance}
                                        cryptoSymbolLabel={cryptoIdToCoinSymbol(receiveSymbol)}
                                        symbol={account.symbol}
                                        sendCryptoSelect={sendCryptoSelect}
                                    />
                                    {accountAddress.path}
                                </InfoSegments>
                            </Column>
                        );
                    }}
                />
            )}
        />
    );
};
