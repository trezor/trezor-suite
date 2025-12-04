import { Controller, UseFormReturn } from 'react-hook-form';
import { createFilter } from 'react-select';

import { FiatCurrencyCode } from 'invity-api';

import { selectTradingLoadingAndTimestamp } from '@suite-common/trading';
import { Row, Select, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';
import { useTradingBuildAccountGroups } from 'src/hooks/wallet/trading/form/common/useTradingBuildAccountGroups';
import { useTradingFiatValues } from 'src/hooks/wallet/trading/form/common/useTradingFiatValues';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import {
    TradingAccountOptionsGroupOptionProps,
    TradingCryptoListProps,
    TradingTradeSellExchangeType,
} from 'src/types/trading/trading';
import {
    TradingFormInputAccountProps,
    TradingSellExchangeFormProps,
} from 'src/types/trading/tradingForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';
import { TradingFormInputAccountOption } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputAccountOption';

export const TradingFormInputAccount = ({
    label,
    accountSelectName,
    'data-testid': dataTestId,
}: TradingFormInputAccountProps) => {
    const context = useTradingFormContext<TradingTradeSellExchangeType>();

    const {
        type,
        account,
        form: {
            helpers: { onCryptoCurrencyChange },
        },
        methods,
    } = context;
    const optionGroups = useTradingBuildAccountGroups(type);

    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);

    const { getValues, control } = methods as UseFormReturn<TradingSellExchangeFormProps>;
    const { [accountSelectName]: selectedOption, outputs } = getValues();

    const fiatValues = useTradingFiatValues({
        amount: selectedOption?.balance,
        cryptoId: selectedOption?.value,
        fiatCurrency: outputs?.[0]?.currency?.value as FiatCurrencyCode,
    });

    return (
        <Controller
            name={accountSelectName}
            control={control}
            render={({ field: { value } }) => (
                <Select
                    value={value}
                    isDisabled={isLoading}
                    isLoading={isLoading}
                    labelLeft={label && <Translation id={label} />}
                    options={optionGroups}
                    onChange={async (selected: TradingAccountOptionsGroupOptionProps) => {
                        await onCryptoCurrencyChange(selected);

                        if (isTradingExchangeContext(context)) {
                            context.resetSelectedOffer();
                        }
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
                            account={account}
                            option={option}
                            decimals={option.decimals}
                            isSelected={context === 'value'}
                        />
                    )}
                    data-testid={dataTestId ?? '@trading/form/select-crypto'}
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
