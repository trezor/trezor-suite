import { useForm } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { isValidAddress, isValidAssetCode } from '@trezor/blockchain-link-stellar/src/utils';
import { Button, Column, Input, Modal, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

type StellarTokenInputModalProps = {
    onSubmit: (assetCode: string, assetIssuer: string) => void;
    onCancel: () => void;
};

type FormData = {
    assetCode: string;
    assetIssuer: string;
};

export const StellarTokenInputModal = ({ onSubmit, onCancel }: StellarTokenInputModalProps) => {
    const { translationString } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        watch,
    } = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            assetCode: '',
            assetIssuer: '',
        },
    });

    // Watch form values to maintain proper UI state
    // We need to watch and pass the values explicitly to the Input components
    // because the Input's label animation CSS relies on the value attribute:
    // `input:not([value='']) ~ &` selector moves the label up when value is not empty.
    // Without explicitly passing the value prop, the label won't animate correctly
    // when using react-hook-form's uncontrolled mode.
    const assetCode = watch('assetCode');
    const assetIssuer = watch('assetIssuer');

    const { ref: assetCodeRef, ...assetCodeField } = register('assetCode', {
        required: true,
        validate: value =>
            !value || isValidAssetCode(value) || translationString('TR_ASSET_CODE_INVALID'),
    });

    const { ref: assetIssuerRef, ...assetIssuerField } = register('assetIssuer', {
        required: true,
        validate: value =>
            !value || isValidAddress(value) || translationString('TR_ISSUER_ADDRESS_INVALID'),
    });

    const handleContinue = handleSubmit((data: FormData) => {
        onSubmit(data.assetCode, data.assetIssuer);
    });

    return (
        <Modal
            width={600}
            onCancel={onCancel}
            heading={<Translation id="TR_ACTIVATE_TOKEN_MANUALLY" />}
            bottomContent={
                <Row gap={spacings.xs}>
                    <Button onClick={handleContinue} isDisabled={!isValid} intent="brand">
                        <Translation id="TR_CONTINUE" />
                    </Button>
                    <Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Button>
                </Row>
            }
        >
            <Column gap={spacings.lg}>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <Translation id="TR_MANUAL_TOKEN_ACTIVATION_DESCRIPTION" />
                </Text>

                <Column gap={spacings.md}>
                    <Input
                        label={<Translation id="TR_ASSET_CODE" />}
                        value={assetCode}
                        innerRef={assetCodeRef}
                        {...assetCodeField}
                        hasError={!!errors.assetCode}
                        bottomText={errors.assetCode?.message || null}
                    />

                    <Input
                        label={<Translation id="TR_ISSUER_ADDRESS" />}
                        value={assetIssuer}
                        innerRef={assetIssuerRef}
                        {...assetIssuerField}
                        hasError={!!errors.assetIssuer}
                        bottomText={errors.assetIssuer?.message || null}
                    />
                </Column>
            </Column>
        </Modal>
    );
};
