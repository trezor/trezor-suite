import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    lazyStellarTokenMetadata,
    resolveStellarAssetFromContractId,
} from '@suite-common/wallet-utils';
import { Button, Column, Input, Modal, Row, Text } from '@trezor/components';
import stellar from '@trezor/network-stellar/runtime';

export type StellarTokenInput =
    | { standard: 'STELLAR-CLASSIC'; assetCode: string; assetIssuer: string }
    | { standard: 'STELLAR-CONTRACT'; contract: string };

type StellarTokenInputModalProps = {
    onSubmit: (token: StellarTokenInput) => void;
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

    return (
        !value ||
        isValidAssetCode(value) ||
        isValidContractId(value) ||
        translate('TR_ASSET_CODE_INVALID')
    );
};

const validateAssetIssuer =
    (translate: (id: TranslationKey) => string, isContractToken: boolean) =>
    async (value: string) => {
        // A contract token is identified by its contract id alone
        if (isContractToken) return true;
        if (!value) return false;

        const { isValidAddress } = await stellar();

        return isValidAddress(value) || translate('TR_ISSUER_ADDRESS_INVALID');
    };

export const StellarTokenInputModal = ({ onSubmit, onCancel }: StellarTokenInputModalProps) => {
    const { translationString } = useTranslation();
    const [isContractToken, setIsContractToken] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        control,
        setValue,
        trigger,
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
        validate: validateAssetIssuer(translationString, isContractToken),
    });

    // A pasted Stellar Asset Contract id is swapped for the classic asset it wraps, so the rest
    // of the activation flow keeps working with an asset code and issuer. Anything else that is a
    // valid contract id is a Soroban contract token, added by its id alone.
    useEffect(() => {
        let isStale = false;

        const classifyContractId = async () => {
            const { isValidContractId } = await stellar();
            if (!isValidContractId(assetCode)) {
                if (!isStale) setIsContractToken(false);

                return;
            }

            const resolved = await resolveContractId(assetCode);
            if (isStale) return;

            setIsContractToken(!resolved);

            if (resolved) {
                setValue('assetCode', resolved.assetCode, { shouldValidate: true });
                setValue('assetIssuer', resolved.assetIssuer, { shouldValidate: true });
            }
        };

        classifyContractId();

        return () => {
            isStale = true;
        };
    }, [assetCode, setValue]);

    // The issuer stops being required the moment the input turns into a contract id, so the
    // already-computed validity has to be recomputed against the new rule.
    useEffect(() => {
        trigger('assetIssuer');
    }, [isContractToken, trigger]);

    const handleContinue = handleSubmit(({ assetCode: code, assetIssuer: issuer }: FormData) => {
        onSubmit(
            isContractToken
                ? { standard: 'STELLAR-CONTRACT', contract: code }
                : { standard: 'STELLAR-CLASSIC', assetCode: code, assetIssuer: issuer },
        );
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

                    {isContractToken ? (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_STELLAR_CONTRACT_TOKEN_DETECTED" />
                        </Text>
                    ) : (
                        <Input
                            label={<Translation id="TR_ISSUER_ADDRESS" />}
                            value={assetIssuer}
                            innerRef={assetIssuerRef}
                            {...assetIssuerField}
                            hasError={!!errors.assetIssuer}
                            bottomText={errors.assetIssuer?.message || null}
                        />
                    )}
                </Column>
            </Column>
        </Modal>
    );
};
