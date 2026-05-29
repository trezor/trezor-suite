import { useEffect } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Card, Column, H4, Icon, IconButton, Row, Text, Textarea } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

const inputName = 'destinationTag';

type TronNoteProps = {
    close: () => void;
};

export const TronNote = ({ close }: TronNoteProps) => {
    const {
        account: { symbol },
        register,
        watch,
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();

    const { translationString } = useTranslation();

    const networkDisplaySymbol = getNetworkDisplaySymbol(symbol);

    const value = watch(inputName);
    const byteSize = Buffer.from(value || '', 'utf8').length;
    const isTooLong = byteSize > formInputsMaxLength.tronNote;
    const error = isTooLong ? translationString('TR_TRON_NOTE_TOO_LONG') : undefined;

    useEffect(() => {
        composeTransaction(inputName);
    }, [value, composeTransaction]);

    const handleClose = () => {
        resetDefaultValue(inputName);
        close();
    };

    const { ref: inputRef, ...inputField } = register(inputName);

    return (
        <Card>
            <Column gap={12}>
                <Row alignItems="start" justifyContent="space-between">
                    <Column gap={2}>
                        <H4 typographyStyle="body-md">
                            <Translation id="TR_TRON_NOTE" />
                        </H4>

                        <Row gap={4}>
                            <Icon name="info" size={20} intent="neutral" priority="secondary" />
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation
                                    id="TR_TRON_NOTE_INFO"
                                    values={{ networkDisplaySymbol }}
                                />
                            </Text>
                        </Row>
                    </Column>

                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon="x"
                        size="small"
                        onClick={handleClose}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>

                <Textarea
                    hasError={isTooLong}
                    bottomText={error}
                    defaultValue={value}
                    innerRef={inputRef}
                    rows={3}
                    characterCount={{
                        current: byteSize,
                        max: formInputsMaxLength.tronNote,
                    }}
                    {...inputField}
                />
            </Column>
        </Card>
    );
};
