import { Controller } from 'react-hook-form';
import { Select, useElevation } from '@trezor/components';
import {
    CoinmarketCryptoListProps,
    CoinmarketOptionsGroupProps,
} from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import { useMemo } from 'react';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    CoinmarketFormOption,
    CoinmarketFormOptionGroupLabel,
    CoinmarketFormOptionLabel,
    CoinmarketFormOptionLabelLong,
    CoinmarketFormOptionLogo,
    CoinmarketFormOptionNetwork,
} from 'src/views/wallet/coinmarket';
import CoinmarketFormInputLabel from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputAccountProps,
} from 'src/types/coinmarket/coinmarketForm';
import { GroupBase, createFilter } from 'react-select';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

const CoinmarketFormInputAccount = <
    TFieldValues extends CoinmarketBuyFormProps | CoinmarketExchangeFormProps,
>({
    label,
    cryptoSelectName,
    supportedCryptoCurrencies,
    methods,
}: CoinmarketFormInputAccountProps<TFieldValues>) => {
    const { elevation } = useElevation();
    const { getNetworkName, buildCryptoOptions } = useCoinmarketInfo();
    const { control } = methods;

    const options = useMemo(
        () => buildCryptoOptions(supportedCryptoCurrencies ?? new Set()),
        [buildCryptoOptions, supportedCryptoCurrencies],
    );

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name={cryptoSelectName}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={options}
                        onChange={onChange}
                        filterOption={createFilter<CoinmarketCryptoListProps>({
                            stringify: option => `${option.value} ${option.data.cryptoName}`,
                        })}
                        formatGroupLabel={(group: GroupBase<any>) => {
                            const { translationId, networkName } =
                                group as CoinmarketOptionsGroupProps;

                            return (
                                <CoinmarketFormOptionGroupLabel>
                                    <Translation id={translationId} values={{ networkName }} />
                                </CoinmarketFormOptionGroupLabel>
                            );
                        }}
                        formatOptionLabel={(option: CoinmarketCryptoListProps) => {
                            const { networkId, contractAddress } = parseCryptoId(option.value);

                            return (
                                <CoinmarketFormOption>
                                    <CoinmarketFormOptionLogo cryptoId={option.value} size={20} />
                                    <CoinmarketFormOptionLabel>
                                        {option.label}
                                    </CoinmarketFormOptionLabel>
                                    <CoinmarketFormOptionLabelLong>
                                        {option.cryptoName}
                                    </CoinmarketFormOptionLabelLong>
                                    {contractAddress && (
                                        <CoinmarketFormOptionNetwork $elevation={elevation}>
                                            {getNetworkName(networkId)}
                                        </CoinmarketFormOptionNetwork>
                                    )}
                                </CoinmarketFormOption>
                            );
                        }}
                        data-testid="@coinmarket/form/account-select"
                        isClearable={false}
                        isSearchable
                    />
                )}
            />
        </>
    );
};

export default CoinmarketFormInputAccount;
