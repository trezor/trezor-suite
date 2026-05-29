import { useEffect } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { isHexValid } from '@suite-common/wallet-utils';
import { Card, Column, H4, IconButton, Row, Textarea } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

const inputHexName = 'transactionData';
const inputAmountName = 'outputs.0.amount';

type TransactionDataProps = {
    maxBytes: number;
    close: () => void;
};

export const TransactionData = ({ maxBytes, close }: TransactionDataProps) => {
    const {
        register,
        formState: { errors },
        setAmount,
        composeTransaction,
        resetDefaultValue,
        trigger,
        watch,
    } = useSendFormContext();
    const { translationString } = useTranslation();

    const [hexValue, amount] = watch([inputHexName, inputAmountName]);

    const maxHexChars = maxBytes * 2;
    const hexError = errors.transactionData;

    const handleClose = () => {
        resetDefaultValue(inputHexName);
        if (amount === '0') {
            setAmount(0, '');
        }
        close();
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (!event.target.value && amount === '0') {
            setAmount(0, '');
        } else if (event.target.value && amount === '') {
            setAmount(0, '0');
        }
        composeTransaction(inputHexName);
    };

    const { ref: hexRef, ...hexField } = register(inputHexName, {
        onChange: handleChange,
        validate: value => {
            if (value && !isHexValid(value, '0x')) {
                return translationString('DATA_NOT_VALID_HEX');
            }
            if (value && value.length > maxHexChars) {
                return translationString('DATA_HEX_TOO_BIG');
            }
        },
    });

    useEffect(() => {
        if (amount === '0' && hexValue) {
            trigger(inputAmountName);
        }
    }, [amount, hexValue, trigger]);

    return (
        <Card>
            <Column gap={12}>
                <Row justifyContent="space-between">
                    <H4 typographyStyle="body-md">
                        <Translation id="DATA" />
                    </H4>
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon="x"
                        size="small"
                        data-testid="send/close-transaction-data"
                        onClick={handleClose}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>
                <Textarea
                    hasError={!!hexError}
                    data-testid={inputHexName}
                    defaultValue={hexValue}
                    maxLength={maxHexChars}
                    bottomText={hexError?.message || null}
                    innerRef={hexRef}
                    {...hexField}
                    characterCount={{
                        current: hexValue?.length,
                        max: maxHexChars,
                    }}
                />
            </Column>
        </Card>
    );
};
