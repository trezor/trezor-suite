import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';

import { CapabilityLabel, Translation, useCapabilityLabelText } from '@suite/intl';
import { getNetwork } from '@suite-common/wallet-config';
import { Banner, Button, Card, Column, Input, Note, Row, Switch } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';
import type { SendMemo } from '@trezor/network-module-suite-common-types';

import { useGuideOpenNode } from '#src/hooks/guide';
import { useSendFormContext } from '#src/hooks/wallet';

export const DESTINATION_TAG_GUIDE_PATH =
    '/3_send-and-receive/transactions-in-depth/destination-tags.md';

const inputName = 'destinationTag';

type RecipientMemoProps = {
    memo: SendMemo;
};

/**
 * A memo the receiving side needs to credit the funds, such as an exchange deposit's destination
 * tag: offered with every recipient, with a warning while it is off.
 */
export const RecipientMemo = ({ memo }: RecipientMemoProps) => {
    // React Compiler: `getDefaultValue` reads the form imperatively, so a compiled render-time read
    // of it freezes as soon as its own identity is stable. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

    const {
        account,
        control,
        register,
        getDefaultValue,
        toggleOption,
        formState: { errors },
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();

    const labelText = useCapabilityLabelText();
    const { openNodeById } = useGuideOpenNode();

    const options = useWatch({ name: 'options', control }) ?? [];
    const isEnabled = options.includes(inputName);
    const isUnavailable = memo.unavailable !== undefined;

    useEffect(() => {
        if (isUnavailable && isEnabled) {
            resetDefaultValue(inputName);
            toggleOption(inputName);
            composeTransaction();
        }
    }, [isUnavailable, isEnabled, resetDefaultValue, toggleOption, composeTransaction]);

    const error = errors[inputName];
    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => composeTransaction(inputName),
        required: memo.requiredMessage && labelText(memo.requiredMessage),
        validate: (value = '') => {
            const message = memo.validate(value);

            return message && labelText(message);
        },
    });

    const handleToggle = () => {
        if (isEnabled) {
            resetDefaultValue(inputName);
        }

        toggleOption(inputName);
        composeTransaction();
    };

    const handleOpenGuide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        openNodeById(DESTINATION_TAG_GUIDE_PATH);
    };

    const offContent = memo.unavailable ? (
        memo.unavailable.reason && (
            <Note gap={8}>
                <CapabilityLabel label={memo.unavailable.reason} />
            </Note>
        )
    ) : (
        <Banner
            intent="warning"
            icon={WarningIcon}
            description={
                <Translation
                    id="DESTINATION_TAG_BANNER_SEND"
                    values={{ networkName: getNetwork(account.symbol).name }}
                />
            }
        />
    );

    return (
        <Card>
            <Column gap={16}>
                <Row justifyContent="space-between">
                    <Switch
                        isChecked={isEnabled}
                        isDisabled={isUnavailable}
                        onChange={handleToggle}
                        label={<CapabilityLabel label={memo.addLabel} />}
                    />
                    <Button
                        intent="neutral"
                        priority="secondary"
                        type="button"
                        size="small"
                        onClick={handleOpenGuide}
                    >
                        <Translation id="DESTINATION_TAG_GUIDE_LINK" />
                    </Button>
                </Row>
                {isEnabled && !isUnavailable ? (
                    <>
                        <Input
                            hasError={!!error}
                            data-testid={inputName}
                            defaultValue={getDefaultValue(inputName) || ''}
                            maxLength={memo.maxLength.value}
                            label={<CapabilityLabel label={memo.label} />}
                            bottomText={error?.message || null}
                            innerRef={inputRef}
                            {...inputField}
                        />
                        <Note gap={8}>
                            <Translation id="DESTINATION_TAG_NOTE" />
                        </Note>
                    </>
                ) : (
                    offContent
                )}
            </Column>
        </Card>
    );
};
