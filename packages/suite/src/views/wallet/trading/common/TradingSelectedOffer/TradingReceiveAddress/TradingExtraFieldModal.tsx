import { useForm } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { isHexValid, isInteger } from '@suite-common/wallet-utils';
import { Input, Modal } from '@trezor/components';

import { type TradingVerifyFormProps } from 'src/types/trading/tradingVerify';
import { TradingExtraField } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingExtraField';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { useTradingReceiveAddressValues } from './useTradingReceiveAddressValues';

export const TradingExtraFieldModal = () => {
    const { tradingReceiveAddress, extraFieldDescription } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const { translationString } = useTranslation();

    const form = useForm<TradingVerifyFormProps>({
        mode: 'onChange',
    });

    const requiresExtraField = !!extraFieldDescription;

    if (!requiresExtraField) return null;

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

    const onCancel = () => {
        modalControls.close();
    };

    const onBackClick = () => {
        onCancel();
        modalControls.open('accountModal');
    };

    const onConfirmClick = () => {
        if (form.formState.errors.extraField) return;

        const { extraField } = form.getValues();

        tradingReceiveAddress.form.setValue('extraField', extraField);

        onCancel();
    };

    return (
        <Modal
            data-testid="@trading/extra-field-modal"
            heading={<Translation id="DESTINATION_TAG" />}
            onCancel={onCancel}
            onBackClick={onBackClick}
            bottomContent={
                <Modal.Button
                    data-testid="@trading/extra-field-modal/confirm-button"
                    onClick={onConfirmClick}
                >
                    <Translation id="TR_CONFIRM" />
                </Modal.Button>
            }
        >
            <TradingExtraField
                inputComponent={
                    <Input
                        data-testid="@trading/extra-field-input"
                        label={<Translation id="DESTINATION_TAG" />}
                        hasError={!!form.formState.errors.extraField}
                        bottomText={form.formState.errors.extraField?.message || null}
                        innerRef={descriptionRef}
                        {...descriptionField}
                    />
                }
                onToggle={() => form.setValue('extraField', '', { shouldValidate: true })}
                required={false}
            />
        </Modal>
    );
};
