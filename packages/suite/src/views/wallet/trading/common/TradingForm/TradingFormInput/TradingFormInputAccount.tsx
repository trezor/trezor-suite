import { Controller } from 'react-hook-form';
import { createFilter } from 'react-select';

import { FiatCurrencyCode } from 'invity-api';

import { Row, Select, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingCryptoListProps,
    TradingTradeSellExchangeType,
} from 'src/types/trading/trading';
import {
    TradingExchangeFormProps,
    TradingFormInputAccountProps,
    TradingSellFormProps,
} from 'src/types/trading/tradingForm';
import { TradingFormInputAccountOption } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAccountOption';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { useTradingBuildAccountGroups } from 'src/hooks/wallet/trading/form/common/useTradingBuildAccountGroups';
import { Translation } from 'src/components/suite';

export const TradingFormInputAccount = <
    TFieldValues extends TradingSellFormProps | TradingExchangeFormProps,
>({
    label,
    accountSelectName,
    methods,
}: TradingFormInputAccountProps<TFieldValues>) => {
    const {
        type,
        form: {
            helpers: { onCryptoCurrencyChange },
        },
    } = useTradingFormContext<TradingTradeSellExchangeType>();
    const optionGroups = useTradingBuildAccountGroups(type);

    const { control, getValues } = methods;
    const selectedOption = getValues(accountSelectName) as
        | TradingAccountOptionsGroupOptionProps
        | undefined;
    const fiatValues = useTradingFiatValues({
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
                    onChange={async (selected: TradingAccountOptionsGroupOptionProps) => {
                        await onCryptoCurrencyChange(selected); // order matters, this has to be called before onChange
                        onChange(selected);
                    }}
                    filterOption={createFilter<TradingCryptoListProps>({
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
                        option: TradingAccountOptionsGroupOptionProps,
                        { context },
                    ) => (
                        <TradingFormInputAccountOption
                            option={option}
                            optionGroups={optionGroups}
                            decimals={option.decimals}
                            isSelected={context === 'value'}
                        />
                    )}
                    data-testid="@trading/form/select-crypto"
                    isClearable={false}
                    isSearchable
                    bottomText={
                        fiatValues && (
                            <TradingBalance
                                balance={fiatValues.accountBalance}
                                symbol={fiatValues.symbol}
                                tokenAddress={fiatValues.tokenAddress}
                                displaySymbol={selectedOption?.label}
                                sendCryptoSelect={selectedOption}
                            />
                        )
                    }
                />
            )}
        />
    );
};
