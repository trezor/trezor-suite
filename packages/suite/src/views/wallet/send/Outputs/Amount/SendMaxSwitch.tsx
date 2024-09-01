import { Switch } from '@trezor/components';
import { breakpointMediaQueries } from '@trezor/styles';
import { spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import styled, { css } from 'styled-components';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledSwitch = styled(Switch)<{
    $hideOnLargeScreens?: boolean;
    $hideOnSmallScreens?: boolean;
}>`
    ${({ $hideOnLargeScreens }) =>
        $hideOnLargeScreens === true &&
        css`
            ${breakpointMediaQueries.lg} {
                display: none;
            }
        `}
    ${({ $hideOnSmallScreens }) =>
        $hideOnSmallScreens &&
        css`
            ${breakpointMediaQueries.below_lg} {
                display: none;
            }
        `}

    ${breakpointMediaQueries.below_md} {
        gap: ${spacingsPx.xs};
    }
`;

interface SendMaxSwitchProps {
    hideOnLargeScreens?: boolean;
    hideOnSmallScreens?: boolean;
    isSetMaxActive: boolean;
    'data-testid'?: string;
    onChange: () => void;
}

export const SendMaxSwitch = ({
    isSetMaxActive,
    'data-testid': dataTest,
    onChange,
    hideOnLargeScreens,
    hideOnSmallScreens,
}: SendMaxSwitchProps) => (
    <StyledSwitch
        $hideOnLargeScreens={hideOnLargeScreens}
        $hideOnSmallScreens={hideOnSmallScreens}
        labelPosition="left"
        isChecked={isSetMaxActive}
        data-testid={dataTest}
        isSmall
        onChange={onChange}
        label={<Translation id="AMOUNT_SEND_MAX" />}
    />
);
