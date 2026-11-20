import { use } from 'react';

import { Translation } from '@suite/intl';
import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { Switch, Textarea } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

export const SignVerifyMessage = () => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <Textarea
            labelLeft={<Translation id="TR_MESSAGE" />}
            labelRight={
                isCompleted ? (
                    <SignVerifyCopyButton
                        value={values.message}
                        data-testid="@sign-verify/copy-message"
                    />
                ) : (
                    <Switch
                        label={<Translation id="TR_HEX_FORMAT" />}
                        labelPosition="start"
                        isChecked={values.hex}
                        onChange={hex => update({ hex })}
                    />
                )
            }
            value={values.message}
            onChange={event => update({ message: event.target.value })}
            readOnly={isCompleted}
            hasError={errors.message !== undefined || outcome === 'failed'}
            characterCount={
                isCompleted
                    ? undefined
                    : { current: values.message.length, max: MAX_LENGTH_MESSAGE }
            }
            bottomText={errors.message ? <Translation id={errors.message} /> : null}
            rows={4}
            data-testid="@sign-verify/message"
        />
    );
};
