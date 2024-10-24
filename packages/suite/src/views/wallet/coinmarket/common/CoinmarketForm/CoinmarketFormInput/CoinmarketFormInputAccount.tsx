import { Controller } from 'react-hook-form';
import { Row, Select } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketCryptoListProps,
    CoinmarketTradeSellExchangeType,
} from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormOptionGroupLabel } from 'src/views/wallet/coinmarket';
import { CoinmarketFormInputLabel } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputLabel';
import {
    CoinmarketExchangeFormProps,
    CoinmarketFormInputAccountProps,
    CoinmarketSellFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import { createFilter } from 'react-select';
import { CoinmarketFormInputAccountOption } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputAccountOption';
import { useCoinmarketFiatValues } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketFiatValues';
import { CoinmarketBalance } from 'src/views/wallet/coinmarket/common/CoinmarketBalance';
import styled from 'styled-components';
import { spacings, spacingsPx } from '@trezor/theme';
import { FiatCurrencyCode } from 'invity-api';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { useCoinmarketBuildAccountGroups } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketBuildAccountGroups';

const CoinmarketBalanceWrapper = styled.div`
    padding: ${spacingsPx.xs} ${spacingsPx.sm} 0;
`;

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
        accountBalance: selectedOption?.balance,
        cryptoSymbol: selectedOption?.value,
        tokenAddress: selectedOption?.contractAddress,
        fiatCurrency: getValues().outputs?.[0]?.currency?.value as FiatCurrencyCode,
    });

    return (
        <>
            <CoinmarketFormInputLabel label={label} />
            <Controller
                name={accountSelectName}
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Select
                        value={value}
                        options={optionGroups}
                        onChange={async (selected: CoinmarketAccountOptionsGroupOptionProps) => {
                            await onCryptoCurrencyChange(selected); // order matters, this has to be called before onChange
                            onChange(selected);
                        }}
                        filterOption={createFilter<CoinmarketCryptoListProps>({
                            stringify: option => `${option.label} ${option.data.cryptoName}`,
                        })}
                        formatGroupLabel={group => (
                            <CoinmarketFormOptionGroupLabel>
                                <Row gap={spacings.xs}>
                                    {group.label}
                                    <AccountTypeBadge
                                        accountType={group.options[0].accountType}
                                        networkType={group.options[0].value}
                                        size="small"
                                    />
                                </Row>
                            </CoinmarketFormOptionGroupLabel>
                        )}
                        formatOptionLabel={(
                            option: CoinmarketAccountOptionsGroupOptionProps,
                            { context },
                        ) => (
                            <CoinmarketFormInputAccountOption
                                option={option}
                                optionGroups={optionGroups}
                                isSelected={context === 'value'}
                            />
                        )}
                        data-testid="@coinmarket/form/select-account"
                        isClearable={false}
                        isSearchable
                    />
                )}
            />
            {fiatValues && (
                <CoinmarketBalanceWrapper>
                    <CoinmarketBalance
                        balance={fiatValues.accountBalance}
                        networkSymbol={fiatValues.networkSymbol}
                        tokenAddress={fiatValues.tokenAddress}
                        cryptoSymbolLabel={selectedOption?.label}
                    />
                </CoinmarketBalanceWrapper>
            )}
        </>
    );
};
