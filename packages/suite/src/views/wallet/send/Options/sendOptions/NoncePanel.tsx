import { Translation, useTranslation } from '@suite/intl';
import { isInteger } from '@suite-common/wallet-utils';
import { Card, Column, H4, IconButton, Input, Row } from '@trezor/components';
import { XIcon } from '@trezor/icons';

import { useSendFormContext } from '#src/hooks/wallet';

import { sendOptionFields } from './sendFormFields';
import type { NoncePanelProps } from './sendOptionPanels';

const inputName = sendOptionFields.nonce.value;

/** A sequence number the user sets by hand, checked only for being a whole number. */
export const NoncePanel = ({ nonce, onCancel }: NoncePanelProps) => {
    // React Compiler: `getDefaultValue` reads the form imperatively, so a compiled render-time read
    // of it freezes as soon as its own identity is stable. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const {
        register,
        getDefaultValue,
        formState: { errors },
        composeTransaction,
    } = useSendFormContext();
    const { translationString } = useTranslation();

    const error = errors[inputName];
    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => composeTransaction(),
        validate: (value: string | undefined) =>
            !value || isInteger(value)
                ? undefined
                : translationString('ETHEREUM_NONCE_IS_NOT_INTEGER'),
    });

    return (
        <Card>
            <Column gap={12}>
                <Row justifyContent="space-between">
                    <H4 typographyStyle="body-md">
                        <Translation id="TR_NONCE" />
                    </H4>
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon={XIcon}
                        size="small"
                        onClick={onCancel}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>
                <Input
                    innerRef={inputRef}
                    {...inputField}
                    defaultValue={getDefaultValue(inputName) || ''}
                    inputMode="numeric"
                    hasError={!!error}
                    maxLength={nonce.maxDigits}
                    bottomText={error?.message || null}
                    data-testid="nonce-input"
                />
            </Column>
        </Card>
    );
};
