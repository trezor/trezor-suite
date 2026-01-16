import { useEffect } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { getInputState, isHexValid } from '@suite-common/wallet-utils';
import { Column, Flex, IconButton, Row, Text, Textarea, Tooltip } from '@trezor/components';

import { OpenGuideFromTooltip } from 'src/components/guide';
import { useLayoutSize } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

export const OpReturn = ({ outputId }: { outputId: number }) => {
    const {
        register,
        setValue,
        formState: { errors },
        composeTransaction,
        removeOpReturn,
        watch,
    } = useSendFormContext();
    const { isBelowTablet } = useLayoutSize();
    const { translationString } = useTranslation();

    const inputAsciiName = `outputs.${outputId}.dataAscii` as const;
    const inputHexName = `outputs.${outputId}.dataHex` as const;

    const asciiValue = watch(inputAsciiName);
    const hexValue = watch(inputHexName);

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const asciiError = outputError ? outputError.dataAscii : undefined;
    const hexError = outputError ? outputError.dataHex : undefined;

    const { ref: asciiRef, ...asciiField } = register(inputAsciiName, {
        onChange: event => {
            setValue(inputHexName, Buffer.from(event.target.value, 'utf-8').toString('hex'), {
                shouldValidate: true,
            });
            composeTransaction(inputAsciiName);
        },
        required: translationString('DATA_NOT_SET'),
    });

    const { ref: hexRef, ...hexField } = register(inputHexName, {
        required: translationString('DATA_NOT_SET'),
        validate: (value = '') => {
            if (!isHexValid(value)) return translationString('DATA_NOT_VALID_HEX');
            if (value.length > 80 * 2) return translationString('DATA_HEX_TOO_BIG');
        },
    });

    useEffect(() => {
        setValue(
            inputAsciiName,
            hexValue && !hexError ? Buffer.from(hexValue, 'hex').toString('utf-8') : '',
        );
    }, [inputAsciiName, hexValue, hexError, setValue]);

    return (
        <Column gap={16}>
            <Row justifyContent="space-between">
                <Tooltip
                    addon={
                        <OpenGuideFromTooltip id="/3_send-and-receive/transactions-in-depth/op_return.md" />
                    }
                    content={<Translation id="OP_RETURN_TOOLTIP" />}
                    hasIcon
                >
                    <Translation id="OP_RETURN_ADD" />
                </Tooltip>

                <IconButton
                    intent="neutral"
                    priority="secondary"
                    icon="x"
                    size="small"
                    onClick={() => removeOpReturn(outputId)}
                />
            </Row>
            <Flex direction={isBelowTablet ? 'column' : 'row'} gap={16} alignItems="center">
                <Textarea
                    inputState={getInputState(asciiError)}
                    data-testid={inputAsciiName}
                    defaultValue={asciiValue}
                    maxLength={formInputsMaxLength.opReturn}
                    bottomText={asciiError?.message || null}
                    label={<Translation id="OP_RETURN_HUMAN" />}
                    innerRef={asciiRef}
                    flex="1"
                    {...asciiField}
                />
                <Text>=</Text>
                <Textarea
                    inputState={getInputState(hexError)}
                    data-testid={inputHexName}
                    defaultValue={hexValue}
                    maxLength={formInputsMaxLength.opReturn}
                    bottomText={hexError?.message || null}
                    label={<Translation id="OP_RETURN_HEX" />}
                    innerRef={hexRef}
                    flex="1"
                    {...hexField}
                />
            </Flex>
        </Column>
    );
};
