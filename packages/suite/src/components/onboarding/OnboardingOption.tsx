import { ReactNode, HTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { Icon, IconProps, useElevation, variables } from '@trezor/components';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

const Wrapper = styled.div<{ elevation: Elevation }>`
    display: flex;
    padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.xl};
    border-radius: ${borders.radii.xs};
    border: solid 1px ${mapElevationToBorder};
    background: ${mapElevationToBackground};
    align-items: center;
    width: 100%;
    cursor: pointer;
    transition: all 0.3s;

    :hover {
        box-shadow: 0 6px 40px 0 ${({ theme }) => theme.BOX_SHADOW_OPTION_CARD};
        border: 1px solid ${({ theme }) => theme.STROKE_GREY_ALT};
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    justify-items: center;
`;

const Heading = styled.span`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Description = styled.span`
    margin-top: 5px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const IconWrapper = styled.div`
    margin-right: 24px;
`;

export const OptionsWrapper = styled.div<{ fullWidth?: boolean }>`
    display: flex;

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }

    ${props =>
        props.fullWidth !== false &&
        css`
            width: 100%;
        `}
`;

export const OptionsDivider = styled.div`
    flex: 0 0 24px;
`;

interface OnboardingOptionProps extends HTMLAttributes<HTMLDivElement> {
    heading: ReactNode;
    description?: ReactNode;
    icon?: IconProps['icon'];
}

export const OnboardingOption = ({
    icon,
    heading,
    description,
    ...rest
}: OnboardingOptionProps) => {
    const { elevation } = useElevation();

    return (
        <Wrapper elevation={elevation} {...rest}>
            {icon && (
                <IconWrapper>
                    <Icon icon={icon} size={48} />
                </IconWrapper>
            )}
            <Content>
                <Heading>{heading}</Heading>
                {description && <Description>{description}</Description>}
            </Content>
        </Wrapper>
    );
};
