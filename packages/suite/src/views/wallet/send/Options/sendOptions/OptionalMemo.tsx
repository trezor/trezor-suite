import { useWatch } from 'react-hook-form';

import { CapabilityLabel, Translation, useCapabilityLabelText } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    Card,
    Column,
    H4,
    Icon,
    IconButton,
    Row,
    Text,
    Textarea,
    Tooltip,
} from '@trezor/components';
import { InfoIcon, XIcon } from '@trezor/icons';
import { type TransactionMemo, getUtf8ByteLength } from '@trezor/network-module-suite-common-types';

import { useSendFormContext } from '#src/hooks/wallet';

import { sendOptionFields } from './sendFormFields';

const inputName = sendOptionFields.memo.value;

type OptionalMemoProps = {
    memo: TransactionMemo;
    close: () => void;
};

/** A memo the sender adds on request, such as a Solana memo or a Tron note. */
export const OptionalMemo = ({ memo, close }: OptionalMemoProps) => {
    // React Compiler: `getDefaultValue` reads the form imperatively, so a compiled render-time read
    // of it freezes as soon as its own identity is stable. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const {
        account: { symbol },
        control,
        register,
        formState: { errors },
        getDefaultValue,
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();
    const labelText = useCapabilityLabelText();

    const value = useWatch({ name: inputName, control }) ?? '';
    const bytes = getUtf8ByteLength(value);
    const isTooLong = memo.maxBytes !== undefined && bytes > memo.maxBytes;
    const error = errors[inputName];

    const handleClose = () => {
        resetDefaultValue(inputName);
        close();
    };

    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => composeTransaction(inputName),
        validate: (fieldValue = '') => {
            const invalid = memo.validate(fieldValue);

            return invalid && labelText(invalid);
        },
    });

    const heading = (
        <H4 typographyStyle="body-md">
            <CapabilityLabel label={memo.labels.name} />
        </H4>
    );

    return (
        <Card>
            <Column gap={12}>
                <Row alignItems="start" justifyContent="space-between">
                    <Column gap={2} alignItems="start">
                        {memo.labels.description ? (
                            <Tooltip
                                hasIcon
                                content={<CapabilityLabel label={memo.labels.description} />}
                            >
                                {heading}
                            </Tooltip>
                        ) : (
                            heading
                        )}

                        {memo.labels.notice && (
                            <Row gap={4}>
                                <Icon
                                    as={InfoIcon}
                                    size={20}
                                    intent="neutral"
                                    priority="secondary"
                                />
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <CapabilityLabel
                                        label={memo.labels.notice}
                                        values={{
                                            networkDisplaySymbol: getNetworkDisplaySymbol(symbol),
                                        }}
                                    />
                                </Text>
                            </Row>
                        )}
                    </Column>

                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon={XIcon}
                        size="small"
                        onClick={handleClose}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>

                <Textarea
                    hasError={isTooLong || !!error}
                    defaultValue={getDefaultValue(inputName) || ''}
                    bottomText={error?.message}
                    innerRef={inputRef}
                    rows={3}
                    {...inputField}
                    characterCount={
                        memo.maxBytes === undefined
                            ? undefined
                            : { current: bytes, max: memo.maxBytes }
                    }
                />
            </Column>
        </Card>
    );
};
