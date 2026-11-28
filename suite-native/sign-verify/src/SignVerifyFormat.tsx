import { use } from 'react';

import { InputWrapper, Select, type SelectItemType } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { throwError } from '@trezor/utils';

import { SignVerifyContext } from './SignVerifyContext';

type SignVerifyFormatProps<TFormat extends string> = {
    options: SelectItemType<TFormat>[];
    value: TFormat;
    onChange: (value: TFormat) => void;
};

export const SignVerifyFormat = <TFormat extends string>({
    options,
    value,
    onChange,
}: SignVerifyFormatProps<TFormat>) => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const title = <Translation id="signAndVerify.format.label" />;

    return (
        <InputWrapper label={title}>
            <Select
                title={title}
                items={options}
                value={value}
                onSelectItem={onChange}
                isReadOnly={outcome === 'signed'}
            />
        </InputWrapper>
    );
};
