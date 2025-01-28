import { ReactElement, ReactNode, useEffect } from 'react';
import { Control, Controller, UseFormReturn } from 'react-hook-form';
import type { MenuPlacement } from 'react-select';

import { CryptoId } from 'invity-api';

import { getDisplaySymbol, getNetwork } from '@suite-common/wallet-config';
import { formatAmount } from '@suite-common/wallet-utils';
import { Column, InfoSegments, Select } from '@trezor/components';
import type { AccountAddress } from '@trezor/connect';

import { Translation } from 'src/components/suite';
import { FORM_SEND_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/trading/form';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { useAccountAddressDictionary } from 'src/hooks/wallet/useAccounts';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import type { Account } from 'src/types/wallet';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { getTradingNetworkDecimals } from 'src/utils/wallet/trading/tradingUtils';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';

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

type TradingBuyAddressOptionsType = {
    address?: string;
};

interface TradingAddressOptionsProps<TFieldValues extends TradingBuyAddressOptionsType>
    extends Pick<UseFormReturn<TFieldValues>, 'setValue'> {
    control: Control<TFieldValues>;
    receiveSymbol?: CryptoId;
    account?: Account;
    address?: string;
    menuPlacement?: MenuPlacement;
    label: ReactNode;
}

export const TradingAddressOptions = <TFieldValues extends TradingBuyAddressOptionsType>({
    receiveSymbol,
    address,
    account,
    label,
    menuPlacement,
    ...props
}: TradingAddressOptionsProps<TFieldValues>) => {
    // Type assertion allowing to make the component reusable, see https://stackoverflow.com/a/73624072.
    const { control, setValue } = props as unknown as UseFormReturn<TradingBuyAddressOptionsType>;
    const context = useTradingFormContext();

    const addresses = account?.addresses;
    const addressDictionary = useAccountAddressDictionary(account);
    const value = address ? addressDictionary[address] : undefined;
    const accountMetadata = useSelector(state =>
        selectLabelingDataForAccount(state, account?.key || ''),
    );
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();

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

                        const sendCryptoSelect = isTradingExchangeContext(context)
                            ? context.getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT)
                            : undefined;

                        const networkDecimals = getTradingNetworkDecimals({
                            sendCryptoSelect,
                            network: getNetwork(account.symbol),
                        });
                        const balance = accountAddress.balance
                            ? formatAmount(accountAddress.balance, networkDecimals)
                            : accountAddress.balance;

                        const { coinSymbol, contractAddress } =
                            cryptoIdToSymbolAndContractAddress(receiveSymbol);
                        const displaySymbol =
                            coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

                        return (
                            <Column>
                                <div data-testid="@trading/form/verify/address">
                                    {accountMetadata.addressLabels[accountAddress.address] ||
                                        accountAddress.address}
                                </div>
                                <InfoSegments typographyStyle="label" variant="tertiary">
                                    <TradingBalance
                                        balance={balance}
                                        displaySymbol={displaySymbol}
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
