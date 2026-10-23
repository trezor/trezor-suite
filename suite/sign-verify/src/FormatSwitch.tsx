import { type ReactNode } from 'react';

import { Box, Row, SelectBar, Text, Tooltip } from '@trezor/components';

const FORMAT_SWITCH_WIDTH = 360;

type FormatSwitchProps<TValue extends string> = {
    label: ReactNode;
    options: { value: TValue; label: ReactNode }[];
    selectedOption?: TValue;
    onChange: (value: TValue) => void;
    isDisabled?: boolean;
    tooltip?: ReactNode;
    'data-testid': string;
};

export const FormatSwitch = <TValue extends string>({
    label: labelContent,
    options,
    tooltip,
    isDisabled,
    'data-testid': dataTestId,
    ...field
}: FormatSwitchProps<TValue>) => {
    const label = (
        <Text case="capitalize" intent="neutral" priority="secondary" typographyStyle="body-md">
            {labelContent}
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
                    isDisabled={isDisabled}
                    options={options}
                    data-testid={dataTestId}
                    {...field}
                />
            </Box>
        </Row>
    );
};
