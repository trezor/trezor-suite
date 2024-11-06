import { useEffect } from 'react';

import { CryptoId } from 'invity-api';

import addressValidator from '@trezor/address-validator';
import { Input, Button, Paragraph, Divider, Column, Tooltip, H4 } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';

import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { ConfirmedOnTrezor } from 'src/views/wallet/coinmarket/common/ConfirmedOnTrezor';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketTradeBuyExchangeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketVerifyOptions } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketVerify/CoinmarketVerifyOptions';
import { CoinmarketVerifyAccountReturnProps } from 'src/types/coinmarket/coinmarketVerify';
import { CoinmarketAddressOptions } from 'src/views/wallet/coinmarket/common/CoinmarketAddressOptions';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { useDispatch } from 'src/hooks/suite';
import { COINMARKET_BUY } from 'src/actions/wallet/constants';
import * as modalActions from 'src/actions/suite/modalActions';
import { isCoinmarketExchangeContext } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';

interface CoinmarketVerifyProps {
    coinmarketVerifyAccount: CoinmarketVerifyAccountReturnProps;
    currency: CryptoId;
}

export const CoinmarketVerify = ({ coinmarketVerifyAccount, currency }: CoinmarketVerifyProps) => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();
    const { cryptoIdToCoinSymbol, cryptoIdToNativeCoinSymbol } = useCoinmarketInfo();
    const context = useCoinmarketFormContext<CoinmarketTradeBuyExchangeType>();
    const { callInProgress, device, verifyAddress, addressVerified, confirmTrade } = context;
    const exchangeQuote = isCoinmarketExchangeContext(context) ? context.selectedQuote : null;
    const {
        form,
        selectedAccountOption,
        accountAddress,
        selectAccountOptions,
        isMenuOpen,
        getTranslationIds,
        onChangeAccount,
    } = coinmarketVerifyAccount;

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

    const { ref: networkRef, ...networkField } = form.register('address', {
        required: translationString('TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED'),
        validate: value => {
            if (selectedAccountOption?.type === 'NON_SUITE' && currency) {
                const symbol = cryptoIdToNativeCoinSymbol(currency);
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
            type: COINMARKET_BUY.VERIFY_ADDRESS,
            addressVerified: undefined,
        });
        dispatch(modalActions.onCancel());
    }, [device?.connected, dispatch]);

    return (
        <Column gap={spacings.xl} alignItems="stretch">
            <Paragraph typographyStyle="hint" variant="tertiary">
                <Translation
                    id="TR_EXCHANGE_RECEIVING_ADDRESS_INFO"
                    values={{ symbol: cryptoIdToCoinSymbol(currency) }}
                />
            </Paragraph>
            <Column gap={spacings.xxs} alignItems="flex-start">
                <Tooltip hasIcon content={<Translation id={accountTooltipTranslationId} />}>
                    <H4>
                        <Translation id="TR_BUY_RECEIVING_ACCOUNT" />
                    </H4>
                </Tooltip>
                <CoinmarketVerifyOptions
                    receiveNetwork={currency}
                    selectedAccountOption={selectedAccountOption}
                    selectAccountOptions={selectAccountOptions}
                    isMenuOpen={isMenuOpen}
                    onChangeAccount={onChangeAccount}
                />
            </Column>
            <Column gap={spacings.xxs} alignItems="stretch">
                {selectedAccountOption?.type === 'SUITE' &&
                    selectedAccountOption?.account?.networkType === 'bitcoin' && (
                        <>
                            <Tooltip
                                hasIcon
                                content={<Translation id={addressTooltipTranslationId} />}
                            >
                                <H4>
                                    <Translation id="TR_BUY_RECEIVING_ADDRESS" />
                                </H4>
                            </Tooltip>
                            <CoinmarketAddressOptions
                                account={selectedAccountOption?.account}
                                address={address}
                                control={form.control}
                                receiveSymbol={currency}
                                setValue={form.setValue}
                            />
                        </>
                    )}
                {selectedAccountOption?.account?.networkType !== 'bitcoin' && (
                    <>
                        <Tooltip hasIcon content={<Translation id={addressTooltipTranslationId} />}>
                            <H4>
                                <Translation id="TR_EXCHANGE_RECEIVING_ADDRESS" />
                            </H4>
                        </Tooltip>
                        <Input
                            readOnly={selectedAccountOption?.type !== 'NON_SUITE'}
                            inputState={form.formState.errors.address ? 'error' : undefined}
                            bottomText={form.formState.errors.address?.message || null}
                            innerRef={networkRef}
                            {...networkField}
                        />
                    </>
                )}

                {device?.connected &&
                    device.available &&
                    addressVerified &&
                    addressVerified === address && <ConfirmedOnTrezor device={device} />}

                {exchangeQuote?.extraFieldDescription && (
                    <Input
                        size="small"
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
                )}
            </Column>
            {selectedAccountOption && (
                <Column>
                    <Divider margin={{ top: spacings.xs, bottom: spacings.lg }} />
                    {(!addressVerified || addressVerified !== address) &&
                        selectedAccountOption.account && (
                            <Button
                                data-testid="@coinmarket/offer/confirm-on-trezor-button"
                                isLoading={callInProgress}
                                isDisabled={callInProgress}
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
                                        device?.connected
                                            ? 'TR_CONFIRM_ON_TREZOR'
                                            : 'TR_CONFIRM_ADDRESS'
                                    }
                                />
                            </Button>
                        )}
                    {((addressVerified && addressVerified === address) ||
                        selectedAccountOption?.type === 'NON_SUITE') && (
                        <Button
                            data-testid="@coinmarket/offer/continue-transaction-button"
                            isLoading={callInProgress}
                            onClick={() => {
                                if (address) {
                                    confirmTrade(address, extraField);
                                }
                            }}
                            isDisabled={!form.formState.isValid || callInProgress}
                        >
                            <Translation id="TR_BUY_GO_TO_PAYMENT" />
                        </Button>
                    )}
                </Column>
            )}
        </Column>
    );
};
