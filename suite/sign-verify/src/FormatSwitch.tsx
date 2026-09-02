import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Box, Row, SelectBar, Text, Tooltip } from '@trezor/components';

const FORMAT_SWITCH_WIDTH = 360;

type FormatSwitchProps = {
    options: { value: boolean; label: ReactNode }[];
    selectedOption?: boolean;
    onChange: (value: boolean) => void;
    isDisabled?: boolean;
    tooltip?: ReactNode;
    'data-testid': string;
};

export const FormatSwitch = ({
    options,
    tooltip,
    isDisabled,
    'data-testid': dataTestId,
    ...field
}: FormatSwitchProps) => {
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
                    isDisabled={isDisabled}
                    options={options}
                    data-testid={dataTestId}
                    {...field}
                />
            </Box>
        </Row>
    );
};
