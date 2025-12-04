import { useForm } from 'react-hook-form';

import { cryptoIdToNetwork, parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';
import addressValidator from '@trezor/address-validator';
import { Button, Column, Input, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useTranslation } from 'src/hooks/suite';
import { TradingVerifyFormProps } from 'src/types/trading/tradingVerify';
import { TradingExtraField } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingExtraField';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from './useTradingReceiveAddressValues';

export const TradingReceiveAddressModal = () => {
    const { tradingReceiveAddress, cryptoId, extraFieldDescription } =
        useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const { translationString } = useTranslation();
    const { cryptoIdToPlatformName, cryptoIdToCoinName, cryptoIdToNativeCoinSymbol } =
        useTradingUtils();

    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const networkName = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    const { selectedAccountOption, selectAccountOptions } = tradingReceiveAddress;

    const form = useForm<TradingVerifyFormProps>({
        mode: 'onChange',
    });

    const requiresExtraField = !!extraFieldDescription;

    const { ref: networkRef, ...networkField } = form.register('address', {
        required: translationString('TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED'),
        validate: value => {
            if (cryptoId) {
                const symbol =
                    cryptoIdToNetwork(cryptoId)?.symbol ?? cryptoIdToNativeCoinSymbol(cryptoId);
                if (value && !addressValidator.validate(value, symbol)) {
                    return translationString('TR_EXCHANGE_RECEIVING_ADDRESS_INVALID');
                }
            }
        },
    });

    const { ref: descriptionRef, ...descriptionField } = form.register('extraField', {
        required: extraFieldDescription?.required
            ? translationString('TR_EXCHANGE_EXTRA_FIELD_REQUIRED', {
                  extraFieldName: extraFieldDescription.name,
              })
            : undefined,
        validate: value => {
            let valid = true;
            if (value) {
                if (extraFieldDescription?.type === 'hex') {
                    valid = isHexValid(value);
                } else if (extraFieldDescription?.type === 'number') {
                    valid = isInteger(value);
                }
            }
            if (!valid) {
                return translationString('TR_EXCHANGE_EXTRA_FIELD_INVALID', {
                    extraFieldName: extraFieldDescription?.name,
                });
            }
        },
    });

    const receiveAddress = form.watch('address');

    const onCancel = () => {
        modalControls.close();
    };

    const onBackClick = () => {
        onCancel();
        modalControls.open('accountModal');
    };

    const onConfirmClick = () => {
        if (form.formState.errors.address || form.formState.errors.extraField) return;

        const nonSuiteOption = selectAccountOptions.find(option => option.type === 'NON_SUITE');
        if (!nonSuiteOption) return;

        const { address, extraField } = form.getValues();

        if (address?.trim() === '') return;

        tradingReceiveAddress.onChangeAccount(nonSuiteOption, address);
        tradingReceiveAddress.form.setValue('extraField', extraField);

        onCancel();
    };

    return (
        <Modal
            data-testid="@trading/receive-address-modal"
            heading={<Translation id="TR_BUY_RECEIVING_ADDRESS" />}
            onCancel={onCancel}
            onBackClick={onBackClick}
            bottomContent={
                <Button
                    data-testid="@trading/receive-address-modal/confirm-button"
                    onClick={onConfirmClick}
                    isDisabled={
                        !!form.formState.errors.address ||
                        !receiveAddress ||
                        receiveAddress.length === 0
                    }
                >
                    <Translation id="TR_CONFIRM" />
                </Button>
            }
        >
            <Column gap={spacings.sm}>
                <Text typographyStyle="body">
                    <Translation
                        id="TR_TRADING_RECEIVE_ADDRESS_ENTER_TEXT"
                        values={{ networkName }}
                    />
                </Text>

                <Input
                    data-testid="@trading/receive-address-input"
                    defaultValue={
                        selectedAccountOption?.type === 'NON_SUITE' &&
                        !!tradingReceiveAddress.receiveAddress
                            ? tradingReceiveAddress.receiveAddress
                            : undefined
                    }
                    inputState={form.formState.errors.address ? 'error' : undefined}
                    bottomText={form.formState.errors.address?.message || null}
                    innerRef={networkRef}
                    {...networkField}
                />

                {requiresExtraField && (
                    <TradingExtraField
                        defaultChecked={
                            selectedAccountOption?.type === 'NON_SUITE' &&
                            !!tradingReceiveAddress.extraField
                        }
                        inputComponent={
                            <Input
                                data-testid="@trading/extra-field-input"
                                label={<Translation id="DESTINATION_TAG" />}
                                defaultValue={
                                    selectedAccountOption?.type === 'NON_SUITE' &&
                                    !!tradingReceiveAddress.extraField
                                        ? tradingReceiveAddress.extraField
                                        : undefined
                                }
                                inputState={form.formState.errors.extraField ? 'error' : undefined}
                                bottomText={form.formState.errors.extraField?.message || null}
                                innerRef={descriptionRef}
                                {...descriptionField}
                            />
                        }
                        onToggle={() => form.setValue('extraField', '', { shouldValidate: true })}
                        required={false}
                    />
                )}
            </Column>
        </Modal>
    );
};
