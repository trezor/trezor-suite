import { use } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { Switch, Textarea } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifyMessage = () => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const {
        register,
        control,
        setValue,
        getValues,
        trigger,
        formState: { errors },
    } = useFormContext<SignVerifyValues>();
    const [message, hex] = useWatch({ control, name: ['message', 'hex'] });

    // A typed message is checked right away, so its length and hex validity show while typing.
    const checkTypedMessage = () => {
        if (getValues('message') !== '') {
            trigger('message');
        }
    };

    const { ref, ...messageField } = register('message', { onChange: checkTypedMessage });
    const error = errors.message?.message as TranslationKey | undefined;
    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <Textarea
            labelLeft={<Translation id="TR_MESSAGE" />}
            labelRight={
                isCompleted ? (
                    <SignVerifyCopyButton value={message} data-testid="@sign-verify/copy-message" />
                ) : (
                    <Switch
                        label={<Translation id="TR_HEX_FORMAT" />}
                        labelPosition="start"
                        isChecked={hex}
                        onChange={isHex => {
                            setValue('hex', isHex);
                            checkTypedMessage();
                        }}
                    />
                )
            }
            innerRef={ref}
            {...messageField}
            readOnly={isCompleted}
            hasError={error !== undefined || outcome === 'failed'}
            characterCount={
                isCompleted ? undefined : { current: message.length, max: MAX_LENGTH_MESSAGE }
            }
            bottomText={error ? <Translation id={error} /> : null}
            rows={4}
            data-testid="@sign-verify/message"
        />
    );
};
