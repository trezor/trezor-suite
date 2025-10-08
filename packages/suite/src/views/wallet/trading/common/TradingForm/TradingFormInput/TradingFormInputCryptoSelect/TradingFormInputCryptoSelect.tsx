import { useCallback, useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';

import {
    TradingAccountOptionsGroupOptionProps,
    TradingBuyFormProps,
    TradingExchangeFormProps,
    TradingTradeBuyExchangeType,
    parseCryptoId,
    selectTradingLoadingAndTimestamp,
    useTradingInfo,
} from '@suite-common/trading';
import { Badge, Row, Select, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormInputCryptoSelectProps } from 'src/types/trading/tradingForm';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';

import { TradingSelectAssetModal } from './TradingSelectAssetModal/TradingSelectAssetModal';
import { TradingCoinLogo } from '../../../TradingCoinLogo';

export const TradingFormInputCryptoSelect = <
    TFieldValues extends TradingBuyFormProps | TradingExchangeFormProps,
>({
    label,
    cryptoSelectName,
    supportedCryptoCurrencies,
    methods: { control },
    isDisabled,
    placeholder,
    'data-testid': dataTestId,
    sortTokensByFiatBalanceInDesc,
}: TradingFormInputCryptoSelectProps<TFieldValues>) => {
    const [isModalActive, setIsModalActive] = useState(false);
    const closeModal = useCallback(() => setIsModalActive(false), []);

    const { translationString } = useTranslation();
    const { isLoading } = useSelector(selectTradingLoadingAndTimestamp);
    const { cryptoIdToPlatformName } = useTradingInfo();

    const context = useTradingFormContext<TradingTradeBuyExchangeType>();
    const { buildCryptoOptions } = useTradingInfo();
    const sendCryptoSelectValue = isTradingExchangeContext(context)
        ? context.getValues()?.sendCryptoSelect?.value
        : null;
    const rawOptions = useMemo(
        () =>
            buildCryptoOptions(
                supportedCryptoCurrencies ?? new Set(),
                sendCryptoSelectValue ? new Set([sendCryptoSelectValue]) : new Set(),
            ),
        [buildCryptoOptions, sendCryptoSelectValue, supportedCryptoCurrencies],
    );

    return (
        <>
            {isModalActive && (
                <TradingSelectAssetModal
                    onModalClose={closeModal}
                    dataTestId={dataTestId}
                    sortTokensByFiatBalanceInDesc={sortTokensByFiatBalanceInDesc}
                    rawOptions={rawOptions}
                />
            )}

            {/* TODO: Select not needed  */}
            <Controller
                name={cryptoSelectName}
                control={control}
                render={({ field: { value } }) => (
                    <Select
                        placeholder={placeholder && !isLoading && translationString(placeholder)}
                        value={value}
                        // The select isn't used. The modal above opens on click/focus event.
                        options={rawOptions}
                        labelLeft={label && <Translation id={label} />}
                        onMenuOpen={() => setIsModalActive(true)}
                        formatOptionLabel={(option: TradingAccountOptionsGroupOptionProps) => {
                            const { networkId, contractAddress } = parseCryptoId(option.value);
                            const platform = cryptoIdToPlatformName(networkId);

                            return (
                                <Row gap={spacings.sm}>
                                    <TradingCoinLogo cryptoId={option.value} size={20} />
                                    <Text>{option.label}</Text>
                                    <Text variant="tertiary" typographyStyle="label">
                                        {option.cryptoName}
                                    </Text>
                                    {contractAddress && <Badge size="small">{platform}</Badge>}
                                </Row>
                            );
                        }}
                        data-testid={dataTestId ?? '@trading/form/select-crypto'}
                        isClearable={false}
                        isMenuOpen={false}
                        isDisabled={isDisabled || isLoading}
                        isLoading={isLoading}
                    />
                )}
            />
        </>
    );
};
