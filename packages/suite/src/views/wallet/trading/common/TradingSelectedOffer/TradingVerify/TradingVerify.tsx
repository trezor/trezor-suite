import { CryptoId, ExchangeTrade } from 'invity-api';

import { cryptoIdToNetwork, useTradingInfo } from '@suite-common/trading';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';
import addressValidator from '@trezor/address-validator';
import { Column, Input, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useTranslation } from 'src/hooks/suite';
import { useTradingReceiveAddress } from 'src/hooks/wallet/trading/form/useTradingReceiveAddress';

import { TradingVerifyDestinationTag } from './TradingVerifyDestinationTag';
import { TradingVerifyOptions } from './TradingVerifyOptions';
import { TradingAddressOptions } from '../../TradingAddressOptions';

interface TradingVerifyProps {
    tradingReceiveAddress: ReturnType<typeof useTradingReceiveAddress>;
    cryptoId: CryptoId;
    exchangeQuote?: ExchangeTrade;
    isLoading: boolean;
}

export const TradingVerify = ({
    tradingReceiveAddress,
    cryptoId,
    exchangeQuote,
    isLoading,
}: TradingVerifyProps) => {
    const { translationString } = useTranslation();
    const { cryptoIdToNativeCoinSymbol } = useTradingInfo();

    const {
        selectedAccountOption,
        selectAccountOptions,
        isMenuOpen,
        onChangeAccount,
        getTranslationIds,
        form,
    } = tradingReceiveAddress;

    const { accountTooltipTranslationId, addressTooltipTranslationId } = getTranslationIds(
        selectedAccountOption?.type,
    );

    const address = form.watch('address');

    const extraFieldDescription = exchangeQuote?.extraFieldDescription
        ? {
              extraFieldName: exchangeQuote?.extraFieldDescription?.name,
              extraFieldDescription: exchangeQuote?.extraFieldDescription?.description,
              toCurrency: exchangeQuote?.receive,
          }
        : {};

    const { ref: networkRef, ...networkField } = form.register('address', {
        required: translationString('TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED'),
        validate: value => {
            if (selectedAccountOption?.type === 'NON_SUITE' && cryptoId) {
                const symbol =
                    cryptoIdToNetwork(cryptoId)?.symbol ?? cryptoIdToNativeCoinSymbol(cryptoId);
                if (value && !addressValidator.validate(value, symbol)) {
                    return translationString('TR_EXCHANGE_RECEIVING_ADDRESS_INVALID');
                }
            }
        },
    });

    const { ref: descriptionRef, ...descriptionField } = form.register('extraField', {
        required: exchangeQuote?.extraFieldDescription?.required
            ? translationString('TR_EXCHANGE_EXTRA_FIELD_REQUIRED', extraFieldDescription)
            : undefined,
        validate: value => {
            let valid = true;
            if (value) {
                if (exchangeQuote?.extraFieldDescription?.type === 'hex') {
                    valid = isHexValid(value);
                } else if (exchangeQuote?.extraFieldDescription?.type === 'number') {
                    valid = isInteger(value);
                }
            }
            if (!valid) {
                return translationString('TR_EXCHANGE_EXTRA_FIELD_INVALID', extraFieldDescription);
            }
        },
    });

    return (
        <Column gap={spacings.xl}>
            <TradingVerifyOptions
                receiveNetwork={cryptoId}
                selectedAccountOption={selectedAccountOption}
                selectAccountOptions={selectAccountOptions}
                isMenuOpen={isMenuOpen}
                onChangeAccount={onChangeAccount}
                isDisabled={isLoading}
                label={
                    <Tooltip hasIcon content={<Translation id={accountTooltipTranslationId} />}>
                        <Translation id="TR_BUY_RECEIVING_ACCOUNT" />
                    </Tooltip>
                }
            />

            {selectedAccountOption && (
                <Column gap={spacings.sm}>
                    {selectedAccountOption?.type === 'SUITE' &&
                        selectedAccountOption?.account?.networkType === 'bitcoin' && (
                            <TradingAddressOptions
                                account={selectedAccountOption?.account}
                                address={address}
                                control={form.control}
                                receiveSymbol={cryptoId}
                                setValue={form.setValue}
                                isDisabled={isLoading}
                                label={
                                    <Tooltip
                                        hasIcon
                                        content={<Translation id={addressTooltipTranslationId} />}
                                    >
                                        <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                                    </Tooltip>
                                }
                            />
                        )}

                    {selectedAccountOption?.account?.networkType !== 'bitcoin' && (
                        <Input
                            data-testid="@trading/form/verify/address"
                            readOnly={selectedAccountOption?.type !== 'NON_SUITE'}
                            inputState={form.formState.errors.address ? 'error' : undefined}
                            labelLeft={
                                <Tooltip
                                    hasIcon
                                    content={<Translation id={addressTooltipTranslationId} />}
                                >
                                    <Translation id="TR_EXCHANGE_RECEIVING_ADDRESS" />
                                </Tooltip>
                            }
                            bottomText={form.formState.errors.address?.message || null}
                            innerRef={networkRef}
                            isDisabled={isLoading}
                            {...networkField}
                        />
                    )}

                    {exchangeQuote?.extraFieldDescription && (
                        <TradingVerifyDestinationTag
                            inputComponent={
                                <Input
                                    label={
                                        <Translation
                                            id="TR_EXCHANGE_EXTRA_FIELD"
                                            values={extraFieldDescription}
                                        />
                                    }
                                    inputState={
                                        form.formState.errors.extraField ? 'error' : undefined
                                    }
                                    bottomText={form.formState.errors.extraField?.message || null}
                                    innerRef={descriptionRef}
                                    isDisabled={isLoading}
                                    {...descriptionField}
                                />
                            }
                            onToggle={() =>
                                form.setValue('extraField', '', { shouldValidate: true })
                            }
                            required={exchangeQuote.extraFieldDescription.required}
                            extraFieldDescription={exchangeQuote.extraFieldDescription}
                            isDisabled={isLoading}
                        />
                    )}
                </Column>
            )}
        </Column>
    );
};
