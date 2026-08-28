import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    lazyStellarTokenMetadata,
    resolveStellarAssetFromContractId,
} from '@suite-common/wallet-utils';
import { Button, Column, Input, Modal, Row, Text } from '@trezor/components';
import stellar from '@trezor/network-stellar/runtime';
type StellarTokenInputModalProps = {
    onSubmit: (assetCode: string, assetIssuer: string) => void;
    onCancel: () => void;
};

type FormData = {
    assetCode: string;
    assetIssuer: string;
};

const resolveContractId = async (contractId: string) =>
    resolveStellarAssetFromContractId(contractId, await lazyStellarTokenMetadata.getOrInit());

const validateAssetCode = (translate: (id: TranslationKey) => string) => async (value: string) => {
    const { isValidAssetCode, isValidContractId } = await stellar();

    if (!value || isValidAssetCode(value)) return true;

    if (isValidContractId(value)) {
        return !!(await resolveContractId(value)) || translate('TR_CONTRACT_ID_UNKNOWN');
    }

    return translate('TR_ASSET_CODE_INVALID');
};

const validateAssetIssuer =
    (translate: (id: TranslationKey) => string) => async (value: string) => {
        const { isValidAddress } = await stellar();

        return !value || isValidAddress(value) || translate('TR_ISSUER_ADDRESS_INVALID');
    };

export const StellarTokenInputModal = ({ onSubmit, onCancel }: StellarTokenInputModalProps) => {
    const { translationString } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        control,
        setValue,
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
    const [assetCode, assetIssuer] = useWatch({ control, name: ['assetCode', 'assetIssuer'] });

    const { ref: assetCodeRef, ...assetCodeField } = register('assetCode', {
        required: true,
        validate: validateAssetCode(translationString),
    });

    const { ref: assetIssuerRef, ...assetIssuerField } = register('assetIssuer', {
        required: true,
        validate: validateAssetIssuer(translationString),
    });

    // A pasted Stellar Asset Contract id is swapped for the classic asset it wraps, so the rest
    // of the activation flow keeps working with an asset code and issuer.
    useEffect(() => {
        let isStale = false;

        const fillFromContractId = async () => {
            const { isValidContractId } = await stellar();
            if (!isValidContractId(assetCode)) return;

            const resolved = await resolveContractId(assetCode);
            if (isStale || !resolved) return;

            setValue('assetCode', resolved.assetCode, { shouldValidate: true });
            setValue('assetIssuer', resolved.assetIssuer, { shouldValidate: true });
        };

        fillFromContractId();

        return () => {
            isStale = true;
        };
    }, [assetCode, setValue]);

    const handleContinue = handleSubmit((data: FormData) => {
        onSubmit(data.assetCode, data.assetIssuer);
    });

    return (
        <Modal
            width={600}
            onCancel={onCancel}
            heading={<Translation id="TR_ACTIVATE_TOKEN_MANUALLY" />}
            bottomContent={
                <Row gap={8}>
                    <Button onClick={handleContinue} isDisabled={!isValid} intent="brand">
                        <Translation id="TR_CONTINUE" />
                    </Button>
                    <Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Button>
                </Row>
            }
        >
            <Column gap={20}>
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <Translation id="TR_MANUAL_TOKEN_ACTIVATION_DESCRIPTION" />
                </Text>

                <Column gap={16}>
                    <Input
                        label={<Translation id="TR_ASSET_CODE_OR_CONTRACT_ID" />}
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
