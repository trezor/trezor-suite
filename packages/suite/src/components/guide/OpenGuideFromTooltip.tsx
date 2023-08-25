import { MouseEvent } from 'react';
import styled, { useTheme } from 'styled-components';
import { transparentize } from 'polished';

import { Icon } from '@trezor/components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { Translation } from 'src/components/suite';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useGuideOpenNode } from 'src/hooks/guide';

const OpenGuideLink = styled(TrezorLink)`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxxs} ${spacingsPx.xs};
    border-radius: ${borders.radii.sm};
    cursor: pointer;

    :hover {
        background: ${({ theme }) => transparentize(0.9, theme.backgroundAlertYellowBold)};
    }
`;

const StyledText = styled.span`
    color: ${({ theme }) => theme.iconAlertYellow};
    ${typography.hint}
    overflow: hidden;
`;

type OpenGuideFromTooltipProps = {
    id: string;
    instance: { hide: () => void };
    dataTest?: string;
};

export const OpenGuideFromTooltip = ({ id, instance, dataTest }: OpenGuideFromTooltipProps) => {
    const { openNodeById } = useGuideOpenNode();
    const theme = useTheme();

    return (
        <OpenGuideLink
            data-test={dataTest}
            onClick={(e: MouseEvent<any>) => {
                e.stopPropagation();
                instance.hide();
                openNodeById(id);
            }}
            variant="nostyle"
        >
            <Icon size={12} color={theme.iconAlertYellow} icon="LIGHTBULB" />
            <StyledText>
                <Translation id="TR_LEARN" />
            </StyledText>
        </OpenGuideLink>
    );
};
