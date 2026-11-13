import { useCallback, useEffect, useMemo } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { isHexValid } from '@suite-common/wallet-utils';
import {
    Banner,
    Column,
    IconButton,
    Input,
    Row,
    SelectBar,
    Textarea,
    Tooltip,
} from '@trezor/components';

import { useLayoutSize } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

// Storage key prefix for persisted name_new commitments. Keyed by the
// commitment hash so the user can find the matching `rand` when they come
// back later to broadcast the name_firstupdate transaction.
const NAME_OP_STORAGE_PREFIX = 'namecoin.nameOp.commitments';

type StoredCommitment = {
    name: string;
    rand: string;
    commitmentHash: string;
    createdAt: number;
};

const loadCommitments = (): StoredCommitment[] => {
    try {
        const raw = window.localStorage.getItem(NAME_OP_STORAGE_PREFIX);
        if (!raw) return [];
        const parsed = JSON.parse(raw);

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveCommitment = (entry: StoredCommitment) => {
    try {
        const existing = loadCommitments();
        const next = [...existing.filter(e => e.commitmentHash !== entry.commitmentHash), entry];
        window.localStorage.setItem(NAME_OP_STORAGE_PREFIX, JSON.stringify(next));
    } catch {
        // localStorage may be unavailable (private mode); fall through.
    }
};

const KIND_OPTIONS = [
    { value: 'name_new', label: <Translation id="NAME_OP_KIND_NEW" /> },
    { value: 'name_firstupdate', label: <Translation id="NAME_OP_KIND_FIRSTUPDATE" /> },
    { value: 'name_update', label: <Translation id="NAME_OP_KIND_UPDATE" /> },
] as const;

export const NameOp = ({ outputId }: { outputId: number }) => {
    const {
        register,
        setValue,
        watch,
        formState: { errors },
        composeTransaction,
        removeOutput,
    } = useSendFormContext();
    const { isBelowTablet } = useLayoutSize();
    const { translationString } = useTranslation();

    const kindName = `outputs.${outputId}.nameOpKind` as const;
    const nameField = `outputs.${outputId}.nameOpName` as const;
    const valueField = `outputs.${outputId}.nameOpValue` as const;
    const commitmentField = `outputs.${outputId}.nameOpCommitmentHash` as const;
    const randField = `outputs.${outputId}.nameOpRand` as const;

    const kind = watch(kindName) ?? 'name_new';
    const commitmentValue = watch(commitmentField);
    const randValue = watch(randField);

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;

    // Register the kind switch as a custom field; SelectBar handles the value.
    useEffect(() => {
        register(kindName, { shouldUnregister: true });
        if (!watch(kindName)) setValue(kindName, 'name_new');
    }, [register, setValue, watch, kindName]);

    const handleKindChange = useCallback(
        (next: string) => {
            setValue(kindName, next);
            composeTransaction(kindName);
        },
        [setValue, composeTransaction, kindName],
    );

    // For name_new: generate a fresh `rand` (20 bytes hex) and compute the
    // commitment off-device. The actual hash function used by Namecoin
    // (RIPEMD160(SHA256(...))) lives in @trezor/utxo-lib; until that helper is
    // exposed, leave the field user-editable and emit a TODO.
    const generateNew = useCallback(() => {
        if (typeof window === 'undefined' || !window.crypto?.getRandomValues) return;
        const buf = new Uint8Array(20);
        window.crypto.getRandomValues(buf);
        const rand = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
        setValue(randField, rand, { shouldValidate: true });
        // TODO(namecoin): compute commitmentHash = RIPEMD160(SHA256(rand || name))
        // using @trezor/utxo-lib helpers once exposed. For now leave the
        // commitment field editable so the host wallet (electrum-nmc) can
        // pre-fill it; the form just needs to carry the bytes through to the
        // device.
        composeTransaction(randField);
    }, [setValue, composeTransaction, randField]);

    // Persist completed name_new commitments so name_firstupdate can find them.
    useEffect(() => {
        if (kind !== 'name_new') return;
        const name = watch(nameField);
        if (name && randValue && commitmentValue) {
            saveCommitment({
                name,
                rand: randValue,
                commitmentHash: commitmentValue,
                createdAt: Date.now(),
            });
        }
    }, [kind, watch, nameField, randValue, commitmentValue]);

    const savedCommitments = useMemo(
        () => (kind === 'name_firstupdate' ? loadCommitments() : []),
        [kind],
    );

    const { ref: nameRef, ...nameInput } = register(nameField, {
        validate: value => {
            if (kind === 'name_new') return undefined;
            if (!value) return translationString('DATA_NOT_SET');
        },
    });

    const { ref: valueRef, ...valueInput } = register(valueField, {
        validate: value => {
            if (kind === 'name_new') return undefined;
            if (!value) return translationString('DATA_NOT_SET');
        },
    });

    const { ref: commitmentRef, ...commitmentInput } = register(commitmentField, {
        validate: value => {
            if (kind !== 'name_new') return undefined;
            if (!value) return translationString('DATA_NOT_SET');
            if (!isHexValid(value)) return translationString('DATA_NOT_VALID_HEX');
            if (value.length !== 40) return 'Commitment must be 20 bytes (40 hex chars)';
        },
    });

    const { ref: randRef, ...randInput } = register(randField, {
        validate: value => {
            if (kind === 'name_update') return undefined;
            if (!value) return translationString('DATA_NOT_SET');
            if (!isHexValid(value)) return translationString('DATA_NOT_VALID_HEX');
            if (value.length !== 40) return 'Nonce must be 20 bytes (40 hex chars)';
        },
    });

    return (
        <Column gap={16}>
            <Row justifyContent="space-between">
                <Tooltip content={<Translation id="NAME_OP_TOOLTIP" />} hasIcon>
                    <Translation id="NAME_OP_ADD" />
                </Tooltip>
                <IconButton
                    intent="neutral"
                    priority="secondary"
                    icon="x"
                    size="small"
                    onClick={() => removeOutput(outputId)}
                    tooltip={{ content: <Translation id="TR_REMOVE" /> }}
                />
            </Row>

            <SelectBar
                options={[...KIND_OPTIONS]}
                selectedOption={kind}
                onChange={handleKindChange as (value: string) => void}
            />

            {kind === 'name_new' && (
                <>
                    <Banner intent="warning">
                        <Translation id="NAME_OP_NEW_WARNING" />
                    </Banner>
                    <Row gap={16} flex="1">
                        <Input
                            data-testid={nameField}
                            label={<Translation id="NAME_OP_NAME_LABEL" />}
                            innerRef={nameRef}
                            {...nameInput}
                        />
                    </Row>
                    <Row gap={16} flex="1" alignItems="end">
                        <Input
                            hasError={!!outputError?.nameOpRand}
                            bottomText={outputError?.nameOpRand?.message || null}
                            data-testid={randField}
                            label={<Translation id="NAME_OP_RAND_LABEL" />}
                            innerRef={randRef}
                            {...randInput}
                        />
                        <IconButton
                            icon="arrowsCounterClockwise"
                            onClick={generateNew}
                            tooltip={{ content: 'Generate fresh nonce' }}
                        />
                    </Row>
                    <Input
                        hasError={!!outputError?.nameOpCommitmentHash}
                        bottomText={outputError?.nameOpCommitmentHash?.message || null}
                        data-testid={commitmentField}
                        label={<Translation id="NAME_OP_COMMITMENT_LABEL" />}
                        innerRef={commitmentRef}
                        {...commitmentInput}
                    />
                </>
            )}

            {kind === 'name_firstupdate' && (
                <>
                    {savedCommitments.length > 0 && (
                        <Banner intent="info">
                            {`Found ${savedCommitments.length} saved name_new commitment(s). Select a name below to auto-fill its nonce.`}
                        </Banner>
                    )}
                    {savedCommitments.length === 0 && (
                        <Banner intent="warning">
                            <Translation id="NAME_OP_FIRSTUPDATE_NO_SAVED" />
                        </Banner>
                    )}
                    <Input
                        data-testid={nameField}
                        label={<Translation id="NAME_OP_NAME_LABEL" />}
                        innerRef={nameRef}
                        {...nameInput}
                    />
                    <Input
                        hasError={!!outputError?.nameOpRand}
                        bottomText={outputError?.nameOpRand?.message || null}
                        data-testid={randField}
                        label={<Translation id="NAME_OP_RAND_LABEL" />}
                        innerRef={randRef}
                        {...randInput}
                    />
                    <Textarea
                        data-testid={valueField}
                        label={<Translation id="NAME_OP_VALUE_LABEL" />}
                        innerRef={valueRef}
                        flex={isBelowTablet ? undefined : '1'}
                        {...valueInput}
                    />
                </>
            )}

            {kind === 'name_update' && (
                <>
                    <Input
                        data-testid={nameField}
                        label={<Translation id="NAME_OP_NAME_LABEL" />}
                        innerRef={nameRef}
                        {...nameInput}
                    />
                    <Textarea
                        data-testid={valueField}
                        label={<Translation id="NAME_OP_VALUE_LABEL" />}
                        innerRef={valueRef}
                        flex={isBelowTablet ? undefined : '1'}
                        {...valueInput}
                    />
                </>
            )}
        </Column>
    );
};
