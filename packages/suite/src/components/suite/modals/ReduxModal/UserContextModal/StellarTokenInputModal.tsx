import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type StellarAssetValidators, useStellarAssetInput } from '@suite-common/stellar-queries';
import { Button, Column, Input, Modal, Row, Text } from '@trezor/components';

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

const validateAssetCode =
    (translate: (id: TranslationKey) => string, validators?: StellarAssetValidators) =>
    (value: string) =>
        !value ||
        !validators ||
        validators.isValidAssetCode(value) ||
        validators.isValidContractId(value) ||
        translate('TR_ASSET_CODE_INVALID');

const validateAssetIssuer =
    (
        translate: (id: TranslationKey) => string,
        isContractToken: boolean,
        validators?: StellarAssetValidators,
    ) =>
    (value: string) => {
        if (isContractToken) return true;
        if (!value) return false;
        if (!validators) return true;

        return validators.isValidAddress(value) || translate('TR_ISSUER_ADDRESS_INVALID');
    };

export const StellarTokenInputModal = ({ onSubmit, onCancel }: StellarTokenInputModalProps) => {
    const { translationString } = useTranslation();

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        control,
        getValues,
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

    const { validators, isContractId, isLoading, isResolvingContractId, resolvedAsset } =
        useStellarAssetInput(assetCode);

    // A Stellar Asset Contract id is swapped for the classic asset it wraps; a contract id that
    // wraps nothing is a native Soroban token, which has an id but no issuer to ask for.
    const isContractToken = isContractId && !resolvedAsset;

    const { ref: assetCodeRef, ...assetCodeField } = register('assetCode', {
        required: true,
        validate: validateAssetCode(translationString, validators),
    });

    const { ref: assetIssuerRef, ...assetIssuerField } = register('assetIssuer', {
        validate: validateAssetIssuer(translationString, isContractToken, validators),
    });

    useEffect(() => {
        if (!resolvedAsset) return;

        setValue('assetCode', resolvedAsset.assetCode, { shouldValidate: true });
        setValue('assetIssuer', resolvedAsset.assetIssuer, { shouldValidate: true });
    }, [resolvedAsset, setValue]);

    // Anything typed before the runtime arrived was accepted on trust; judge it once it is in.
    const hasJudgedWithValidators = useRef(false);
    useEffect(() => {
        if (!validators || hasJudgedWithValidators.current) return;

        hasJudgedWithValidators.current = true;
        if (getValues('assetCode') || getValues('assetIssuer')) {
            trigger();
        }
    }, [getValues, trigger, validators]);

    // Revalidate the issuer when the rule changes; on mount it would paint the empty field red.
    const hasClassifiedContractId = useRef(false);
    useEffect(() => {
        if (!hasClassifiedContractId.current) {
            hasClassifiedContractId.current = true;

            return;
        }

        trigger('assetIssuer');
    }, [isContractToken, trigger]);

    const handleContinue = handleSubmit(({ assetCode: code, assetIssuer: issuer }: FormData) => {
        // Derived from the submitted value, so a racing resolution cannot misfile it.
        onSubmit(
            validators?.isValidContractId(code)
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
                    <Button
                        onClick={handleContinue}
                        // The issuer is optional for a contract id, so the form turns valid
                        // before the id is classified.
                        isDisabled={!isValid || isLoading || isResolvingContractId}
                        intent="brand"
                    >
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
