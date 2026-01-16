import { useEffect } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { getInputState, isHexValid } from '@suite-common/wallet-utils';
import { Card, Column, H4, IconButton, Row, Textarea } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

const inputAsciiName = 'ethereumDataAscii';
const inputHexName = 'transactionData';
const inputAmountName = 'outputs.0.amount';

type EthereumDataProps = {
    close: () => void;
};

export const EthereumData = ({ close }: EthereumDataProps) => {
    const {
        register,
        formState: { errors },
        setValue,
        setAmount,
        composeTransaction,
        resetDefaultValue,
        trigger,
        watch,
    } = useSendFormContext();
    const { translationString } = useTranslation();

    const [asciiValue, hexValue, amount] = watch([inputAsciiName, inputHexName, inputAmountName]);

    const asciiError = errors.ethereumDataAscii;
    const hexError = errors.transactionData;

    const handleClose = () => {
        resetDefaultValue(inputAsciiName);
        resetDefaultValue(inputHexName);
        if (amount === '0') {
            setAmount(0, '');
        }
        close();
    };

    const getChangeHandler =
        (isHex: boolean) => (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setValue(
                isHex ? inputAsciiName : inputHexName,
                Buffer.from(event.target.value, isHex ? 'hex' : 'ascii').toString(
                    isHex ? 'ascii' : 'hex',
                ),
                { shouldValidate: true },
            );
            if (!event.target.value && amount === '0') {
                setAmount(0, '');
            } else if (event.target.value && amount === '') {
                setAmount(0, '0');
            }
            composeTransaction(isHex ? inputHexName : inputAsciiName);
        };

    const { ref: asciiRef, ...asciiField } = register(inputAsciiName, {
        onChange: getChangeHandler(false),
    });
    const { ref: hexRef, ...hexField } = register(inputHexName, {
        onChange: getChangeHandler(true),
        validate: value => {
            if (value && !isHexValid(value, '0x')) {
                return translationString('DATA_NOT_VALID_HEX');
            }
            if (value && value.length > formInputsMaxLength.ethData * 2) {
                return translationString('DATA_HEX_TOO_BIG');
            }
        },
    });

    // Trigger amount validation after data is set. This removes the validation message if amount is 0.
    // A transaction with 0 amount is valid as long as it has data - this type of transaction can be used to interact with contract.
    useEffect(() => {
        if (amount === '0' && hexValue) {
            trigger(inputAmountName);
        }
    }, [amount, hexValue, trigger]);

    return (
        <Card>
            <Column gap={12}>
                <Row justifyContent="space-between">
                    <H4 typographyStyle="body">
                        <Translation id="DATA_ETH" />
                    </H4>
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon="x"
                        size="small"
                        data-testid="send/close-ethereum-data"
                        onClick={handleClose}
                    />
                </Row>
                <Row gap={16}>
                    <Textarea
                        inputState={getInputState(asciiError)}
                        data-testid={inputAsciiName}
                        defaultValue={asciiValue}
                        maxLength={formInputsMaxLength.ethData}
                        bottomText={asciiError?.message || null}
                        innerRef={asciiRef}
                        {...asciiField}
                        characterCount={{
                            current: asciiValue?.length,
                            max: formInputsMaxLength.ethData,
                        }}
                    />
                    <>=</>
                    <Textarea
                        inputState={getInputState(hexError)}
                        data-testid={inputHexName}
                        defaultValue={hexValue}
                        maxLength={formInputsMaxLength.ethData}
                        bottomText={hexError?.message || null}
                        innerRef={hexRef}
                        {...hexField}
                        characterCount={{
                            current: hexValue?.length,
                            max: formInputsMaxLength.ethData * 2,
                        }}
                    />
                </Row>
            </Column>
        </Card>
    );
};
