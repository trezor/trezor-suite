import { type ReactNode, use } from 'react';

import { Translation } from '@suite/intl';
import { Box, Row, SelectBar, Text, Tooltip } from '@trezor/components';
import { throwError } from '@trezor/utils';

import { SignVerifyContext } from './SignVerifyContext';

const FORMAT_SWITCH_WIDTH = 360;

type SignVerifyFormatOption<TFormat extends string> = {
    value: TFormat;
    label: ReactNode;
};

type SignVerifyFormatProps<TFormat extends string> = {
    options: SignVerifyFormatOption<TFormat>[];
    value: TFormat;
    onChange: (value: TFormat) => void;
    tooltip?: ReactNode;
};

export const SignVerifyFormat = <TFormat extends string>({
    options,
    value,
    onChange,
    tooltip,
}: SignVerifyFormatProps<TFormat>) => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const label = (
        <Text case="capitalize" intent="neutral" priority="secondary" typographyStyle="body-md">
            <Translation id="TR_FORMAT" />
        </Text>
    );

    return (
        <Row gap={12}>
            {tooltip ? (
                <Tooltip maxWidth={330} content={tooltip} hasIcon>
                    {label}
                </Tooltip>
            ) : (
                label
            )}
            <Box width={FORMAT_SWITCH_WIDTH}>
                <SelectBar
                    isFullWidth
                    isDisabled={outcome !== 'idle'}
                    options={options}
                    selectedOption={value}
                    onChange={onChange}
                    data-testid="@sign-verify/format"
                />
            </Box>
        </Row>
    );
};
