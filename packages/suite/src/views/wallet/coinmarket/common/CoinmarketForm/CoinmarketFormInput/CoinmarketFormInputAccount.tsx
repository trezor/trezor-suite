import { Controller } from 'react-hook-form';
import { createFilter } from 'react-select';

import { FiatCurrencyCode } from 'invity-api';

import { Row, Select, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketCryptoListProps,
    CoinmarketTradeSellExchangeType,
} from 'src/types/coinmarket/coinmarket';
import {
    CoinmarketExchangeFormProps,
    CoinmarketFormInputAccountProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketFormInputAccountOption } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccountOption';
import { useCoinmarketFiatValues } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketFiatValues';
import { CoinmarketBalance } from 'src/views/wallet/coinmarket/common/CoinmarketBalance';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketBuildAccountGroups';
import { Translation } from 'src/components/suite';

export const CoinmarketFormInputAccount = <
    TFieldValues extends CoinmarketSellFormProps | CoinmarketExchangeFormProps,
>({
    label,
    accountSelectName,
    methods,
}: CoinmarketFormInputAccountProps<TFieldValues>) => {
    const {
        type,
        form: {
            helpers: { onCryptoCurrencyChange },
        },
    } = useCoinmarketFormContext<CoinmarketTradeSellExchangeType>();
    const optionGroups = useCoinmarketBuildAccountGroups(type);

    const { control, getValues } = methods;
    const selectedOption = getValues(accountSelectName) as
        | CoinmarketAccountOptionsGroupOptionProps
        | undefined;
    const fiatValues = useCoinmarketFiatValues({
        sendCryptoSelect: selectedOption,
        fiatCurrency: getValues().outputs?.[0]?.currency?.value as FiatCurrencyCode,
    });

    return (
        <Controller
            name={accountSelectName}
            control={control}
            render={({ field: { onChange, value } }) => (
                <Select
                    value={value}
                    labelLeft={label && <Translation id={label} />}
                    options={optionGroups}
                    onChange={async (selected: CoinmarketAccountOptionsGroupOptionProps) => {
                        await onCryptoCurrencyChange(selected); // order matters, this has to be called before onChange
                        onChange(selected);
                    }}
                    filterOption={createFilter<CoinmarketCryptoListProps>({
                        stringify: option => `${option.label} ${option.data.cryptoName}`,
                    })}
                    formatGroupLabel={group => (
                        <Text as="div" variant="tertiary">
                            <Row gap={spacings.xs}>
                                {group.label}
                                <AccountTypeBadge
                                    accountType={group.options[0].accountType}
                                    networkType={group.options[0].value}
                                    size="small"
                                />
                            </Row>
                        </Text>
                    )}
                    formatOptionLabel={(
                        option: CoinmarketAccountOptionsGroupOptionProps,
                        { context },
                    ) => (
                        <CoinmarketFormInputAccountOption
                            option={option}
                            optionGroups={optionGroups}
                            decimals={option.decimals}
                            isSelected={context === 'value'}
                        />
                    )}
                    data-testid="@coinmarket/form/select-account"
                    isClearable={false}
                    isSearchable
                    bottomText={
                        fiatValues && (
                            <CoinmarketBalance
                                balance={fiatValues.accountBalance}
                                networkSymbol={fiatValues.networkSymbol}
                                tokenAddress={fiatValues.tokenAddress}
                                cryptoSymbolLabel={selectedOption?.label}
                                sendCryptoSelect={selectedOption}
                            />
                        )
                    }
                />
            )}
        />
    );
};
