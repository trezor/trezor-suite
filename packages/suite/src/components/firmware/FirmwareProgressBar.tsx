import { Icon, ProgressBar, variables } from '@trezor/components';
import styled, { useTheme } from 'styled-components';
import { borders, spacingsPx } from '@trezor/theme';
import { useFirmware } from 'src/hooks/suite';

const Wrapper = styled.div`
    display: flex;
    border-radius: ${borders.radii.xs};
    padding: ${spacingsPx.lg} ${spacingsPx.xl};
    width: 100%;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    align-items: center;

    ${variables.SCREEN_QUERY.ABOVE_LAPTOP} {
        &:last-child {
            border-radius: 0 0 ${borders.radii.md} ${borders.radii.md};
        }
    }
`;

const Label = styled.div`
    display: flex;
    margin-right: ${spacingsPx.lg};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledProgressBar = styled(ProgressBar)`
    display: flex;
    margin-right: ${spacingsPx.lg};
    border-radius: ${borders.radii.xxs};
    background: ${({ theme }) => theme.legacy.STROKE_GREY_ALT};
    flex: 1;

    ${ProgressBar.Value} {
        height: 3px;
        position: relative;
        border-radius: ${borders.radii.xxs};
    }
`;
const Percentage = styled.div`
    display: flex;
    margin-left: ${spacingsPx.sm};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-variant-numeric: tabular-nums;
    height: ${spacingsPx.xl};
`;

export const FirmwareProgressBar = () => {
    const theme = useTheme();
    const { operation, progress } = useFirmware();

    const isDone = progress === 100;

    return (
        <Wrapper>
            <Label>{operation}</Label>
            <StyledProgressBar value={progress} />
            <Percentage>
                {isDone ? (
                    <Icon name="check" color={theme.legacy.TYPE_GREEN} size={24} />
                ) : (
                    `${progress} %`
                )}
            </Percentage>
        </Wrapper>
    );
};
