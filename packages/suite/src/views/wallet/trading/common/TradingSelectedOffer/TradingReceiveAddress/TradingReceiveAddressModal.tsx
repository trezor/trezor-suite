import { useForm } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { cryptoIdToNetwork, parseCryptoId, useTradingUtils } from '@suite-common/trading';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';
import addressValidator from '@trezor/address-validator';
import { Column, Input, Modal, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { type TradingVerifyFormProps } from 'src/types/trading/tradingVerify';
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

    const { selectedAccount, selectNonSuiteAddress } = tradingReceiveAddress;

    const form = useForm<TradingVerifyFormProps>({
        mode: 'onChange',
    });

    const requiresExtraField = !!extraFieldDescription;

    const { ref: networkRef, ...networkField } = form.register('address', {
        required: translationString('TR_EXCHANGE_RECEIVING_ADDRESS_REQUIRED'),
        validate: value => {
            if (cryptoId) {
                const network = cryptoIdToNetwork(cryptoId);
                const symbol = network?.symbol ?? cryptoIdToNativeCoinSymbol(cryptoId);

                let isValid = true;

                try {
                    isValid = value ? addressValidator.validate(value, symbol, network?.networkType) : true;
                } catch {
                    isValid = false;
                }

                if (!isValid) {
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

        const { address, extraField } = form.getValues();

        if (!address || address.trim() === '') return;

        selectNonSuiteAddress(address, extraField);

        onCancel();
    };

    return (
        <Modal
            data-testid="@trading/receive-address-modal"
            heading={<Translation id="TR_BUY_RECEIVING_ADDRESS" />}
            onCancel={onCancel}
            onBackClick={onBackClick}
            bottomContent={
                <Modal.Button
                    data-testid="@trading/receive-address-modal/confirm-button"
                    onClick={onConfirmClick}
                    isDisabled={
                        !!form.formState.errors.address ||
                        !receiveAddress ||
                        receiveAddress.length === 0
                    }
                >
                    <Translation id="TR_CONFIRM" />
                </Modal.Button>
            }
        >
            <Column gap={spacings.sm}>
                <Text typographyStyle="body-md">
                    <Translation
                        id="TR_TRADING_RECEIVE_ADDRESS_ENTER_TEXT"
                        values={{ networkName }}
                    />
                </Text>

                <Input
                    data-testid="@trading/receive-address-input"
                    defaultValue={
                        selectedAccount === null && !!tradingReceiveAddress.receiveAddress
                            ? tradingReceiveAddress.receiveAddress
                            : undefined
                    }
                    hasError={!!form.formState.errors.address}
                    bottomText={form.formState.errors.address?.message || null}
                    innerRef={networkRef}
                    {...networkField}
                />

                {requiresExtraField && (
                    <TradingExtraField
                        defaultChecked={
                            selectedAccount === null && !!tradingReceiveAddress.extraField
                        }
                        inputComponent={
                            <Input
                                data-testid="@trading/extra-field-input"
                                label={<Translation id="DESTINATION_TAG" />}
                                defaultValue={
                                    selectedAccount === null && !!tradingReceiveAddress.extraField
                                        ? tradingReceiveAddress.extraField
                                        : undefined
                                }
                                hasError={!!form.formState.errors.extraField}
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
