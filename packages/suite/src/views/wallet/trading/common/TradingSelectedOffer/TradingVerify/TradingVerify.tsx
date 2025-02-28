import { useEffect } from 'react';

import { CryptoId } from 'invity-api';

import { TradingExchangeType, cryptoIdToNetwork } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';
import addressValidator from '@trezor/address-validator';
import { Button, Column, Divider, Input, Paragraph, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import * as modalActions from 'src/actions/suite/modalActions';
import { TRADING_BUY } from 'src/actions/wallet/constants';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';
import { TradingVerifyAccountReturnProps } from 'src/types/trading/tradingVerify';
import {
    isTradingBuyContext,
    isTradingExchangeContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { ConfirmedOnTrezor } from 'src/views/wallet/trading/common/ConfirmedOnTrezor';
import { TradingAddressOptions } from 'src/views/wallet/trading/common/TradingAddressOptions';
import { TradingVerifyDestinationTag } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingVerify/TradingVerifyDestinationTag';
import { TradingVerifyOptions } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingVerify/TradingVerifyOptions';

interface TradingVerifyProps {
    tradingVerifyAccount: TradingVerifyAccountReturnProps;
    cryptoId: CryptoId;
}

export const TradingVerify = ({ tradingVerifyAccount, cryptoId }: TradingVerifyProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { cryptoIdToNativeCoinSymbol, cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const context = useTradingFormContext<TradingExchangeType>();
    const { callInProgress, device, verifyAddress, addressVerified, confirmTrade } = context;
    const exchangeQuote = isTradingExchangeContext(context) ? context.selectedQuote : null;
    const {
        form,
        selectedAccountOption,
        accountAddress,
        selectAccountOptions,
        isMenuOpen,
        getTranslationIds,
        onChangeAccount,
    } = tradingVerifyAccount;

    const address = form.watch('address');
    const extraField = form.watch('extraField');
    const extraFieldDescription = exchangeQuote?.extraFieldDescription
        ? {
              extraFieldName: exchangeQuote?.extraFieldDescription?.name,
              extraFieldDescription: exchangeQuote?.extraFieldDescription?.description,
              toCurrency: exchangeQuote?.receive,
          }
        : {};

    const { accountTooltipTranslationId, addressTooltipTranslationId } = getTranslationIds(
        selectedAccountOption?.type,
    );
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoId);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

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

    // close modals and reset addressVerified on device connection change
    useEffect(() => {
        dispatch({
            type: TRADING_BUY.VERIFY_ADDRESS,
            addressVerified: undefined,
        });
        dispatch(modalActions.onCancel());
    }, [device?.connected, dispatch]);

    return (
        <Column gap={spacings.xl}>
            <Paragraph typographyStyle="hint" variant="tertiary">
                <Translation
                    id="TR_EXCHANGE_RECEIVING_ADDRESS_INFO"
                    values={{ symbol: displaySymbol }}
                />
            </Paragraph>
            <TradingVerifyOptions
                receiveNetwork={cryptoId}
                selectedAccountOption={selectedAccountOption}
                selectAccountOptions={selectAccountOptions}
                isMenuOpen={isMenuOpen}
                onChangeAccount={onChangeAccount}
                label={
                    <Tooltip hasIcon content={<Translation id={accountTooltipTranslationId} />}>
                        <Translation id="TR_BUY_RECEIVING_ACCOUNT" />
                    </Tooltip>
                }
            />

            <Column gap={spacings.sm}>
                {selectedAccountOption?.type === 'SUITE' &&
                    selectedAccountOption?.account?.networkType === 'bitcoin' && (
                        <TradingAddressOptions
                            account={selectedAccountOption?.account}
                            address={address}
                            control={form.control}
                            receiveSymbol={cryptoId}
                            setValue={form.setValue}
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
                                inputState={form.formState.errors.extraField ? 'error' : undefined}
                                bottomText={form.formState.errors.extraField?.message || null}
                                innerRef={descriptionRef}
                                {...descriptionField}
                            />
                        }
                        onToggle={() => form.setValue('extraField', '', { shouldValidate: true })}
                        required={exchangeQuote.extraFieldDescription.required}
                        extraFieldDescription={exchangeQuote.extraFieldDescription}
                    />
                )}

                {device?.connected &&
                    device.available &&
                    addressVerified &&
                    addressVerified === address && <ConfirmedOnTrezor device={device} />}
            </Column>
            {selectedAccountOption && (
                <Column>
                    <Divider margin={{ top: spacings.xs, bottom: spacings.lg }} />
                    {(!addressVerified || addressVerified !== address) &&
                        selectedAccountOption.account && (
                            <Button
                                data-testid="@trading/offer/confirm-on-trezor-button"
                                isLoading={callInProgress}
                                isDisabled={
                                    callInProgress ||
                                    (!device?.connected && !isTradingBuyContext(context))
                                }
                                onClick={() => {
                                    if (selectedAccountOption.account && accountAddress) {
                                        dispatch(
                                            verifyAddress(
                                                selectedAccountOption.account,
                                                accountAddress.address,
                                                accountAddress.path,
                                            ),
                                        );
                                    }
                                }}
                            >
                                <Translation
                                    id={
                                        device?.connected || !isTradingBuyContext(context)
                                            ? 'TR_CONFIRM_ON_TREZOR'
                                            : 'TR_CONFIRM_ADDRESS'
                                    }
                                />
                            </Button>
                        )}
                    {((addressVerified && addressVerified === address) ||
                        selectedAccountOption?.type === 'NON_SUITE') && (
                        <Button
                            data-testid="@trading/offer/continue-transaction-button"
                            isLoading={callInProgress}
                            onClick={() => {
                                if (address) {
                                    confirmTrade(address, extraField);
                                }
                            }}
                            isDisabled={!form.formState.isValid || address === '' || callInProgress}
                        >
                            <Translation id="TR_BUY_GO_TO_PAYMENT" />
                        </Button>
                    )}
                </Column>
            )}
        </Column>
    );
};
