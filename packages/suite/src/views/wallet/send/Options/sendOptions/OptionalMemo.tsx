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
import type { SendMemo } from '@trezor/network-module-suite-common-types';

import { useSendFormContext } from '#src/hooks/wallet';

const inputName = 'destinationTag';

const getLength = (value: string, unit: SendMemo['maxLength']['unit']) =>
    unit === 'bytes' ? Buffer.from(value, 'utf8').length : value.length;

type OptionalMemoProps = {
    memo: SendMemo;
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
    const length = getLength(value, memo.maxLength.unit);
    const isTooLong = length > memo.maxLength.value;
    const error = errors[inputName];
    const message =
        error?.message ||
        (isTooLong && memo.tooLongMessage ? labelText(memo.tooLongMessage) : undefined);

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
            <CapabilityLabel label={memo.label} />
        </H4>
    );

    return (
        <Card>
            <Column gap={12}>
                <Row alignItems="start" justifyContent="space-between">
                    <Column gap={2} alignItems="start">
                        {memo.tooltip ? (
                            <Tooltip hasIcon content={<CapabilityLabel label={memo.tooltip} />}>
                                {heading}
                            </Tooltip>
                        ) : (
                            heading
                        )}

                        {memo.note && (
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
                                        label={memo.note}
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
                    bottomText={message}
                    innerRef={inputRef}
                    rows={3}
                    {...inputField}
                    characterCount={{ current: length, max: memo.maxLength.value }}
                />
            </Column>
        </Card>
    );
};
