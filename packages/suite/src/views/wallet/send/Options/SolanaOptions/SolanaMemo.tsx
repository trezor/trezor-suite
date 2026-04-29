import { Translation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { Card, Column, H4, IconButton, Row, Textarea } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

type SolanaMemoProps = {
    close: () => void;
};

export const SolanaMemo = ({ close }: SolanaMemoProps) => {
    const {
        register,
        watch,
        formState: { errors },
        getDefaultValue,
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();

    const inputName = 'destinationTag';
    const inputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];
    const memoByteSize = Buffer.from(watch(inputName) || '', 'utf8').length;
    const isMemoTooLong = memoByteSize > formInputsMaxLength.solanaMemo;

    const handleClose = () => {
        resetDefaultValue(inputName);
        close();
    };

    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => composeTransaction(inputName),
    });

    return (
        <Card>
            <Column gap={12}>
                <Row justifyContent="space-between">
                    <H4 typographyStyle="body-md">
                        <Translation id="MEMO" />
                    </H4>
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon="x"
                        size="small"
                        onClick={handleClose}
                    />
                </Row>
                <Textarea
                    hasError={isMemoTooLong || !!error}
                    defaultValue={inputValue}
                    maxLength={formInputsMaxLength.solanaMemo}
                    bottomText={error?.message}
                    innerRef={inputRef}
                    {...inputField}
                    characterCount={{
                        current: memoByteSize,
                        max: formInputsMaxLength.solanaMemo,
                    }}
                />
            </Column>
        </Card>
    );
};
