import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
    useTheme,
    Icon,
    IconProps,
    variables,
    HoverAnimation,
    FluidSpinner,
} from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

const Wrapper = styled.div<Pick<ActionItemProps, 'isOpen' | 'marginLeft'>>`
    width: 44px;
    height: 44px;
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    margin-left: ${({ marginLeft }) => marginLeft && '8px'};
    background: ${({ isOpen, theme }) => isOpen && theme.BG_GREY_OPEN};
    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};
`;

const MobileWrapper = styled.div<Pick<ActionItemProps, 'isActive'>>`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;

    & + & {
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

const MobileIconWrapper = styled.div<Pick<ActionItemProps, 'isActive'>>`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    margin-right: 16px;
`;

const Label = styled.span`
    padding: 16px 8px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const AlertDotWrapper = styled.div`
    position: absolute;
    top: 9px;
    right: 10px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.BG_WHITE};
    animation: ${FADE_IN} 0.2s ease-out;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        top: 0;
        right: 0;
    }
`;

const AlertDot = styled.div`
    position: relative;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${({ theme }) => theme.TYPE_ORANGE};
`;

const Indicator = styled.div`
    background: ${({ theme }) => theme.BG_WHITE};
    display: flex;
    align-items: center;
    justify-content: center;
    height: 10px;
    width: 10px;
    border-radius: 50%;
    position: absolute;
    top: 9px;
    right: 10px;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        top: 0;
        right: 0;
    }

    svg {
        animation: ${FADE_IN} 0.2s ease-out;
    }
`;

export type IndicatorStatus = 'check' | 'alert' | 'loading';

interface CommonProps extends Pick<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    label: React.ReactNode;
    isActive?: boolean;
    isOpen?: boolean;
    indicator?: IndicatorStatus;
    isMobileLayout?: boolean;
    marginLeft?: boolean;
}

interface CustomIconComponentProps extends CommonProps {
    iconComponent: React.ReactNode;
    icon?: never;
}
interface IconComponentProps extends CommonProps {
    icon: IconProps['icon'];
    iconComponent?: never;
}

type ActionItemProps = CustomIconComponentProps | IconComponentProps;

// Reason to use forwardRef: We want the user to be able to close Notifications dropdown by clicking somewhere else.
// In order to achieve that behavior, we need to pass reference to ActionItem
export const ActionItem = React.forwardRef(
    (props: ActionItemProps, ref: React.Ref<HTMLDivElement>) => {
        const theme = useTheme();

        const iconComponent = useMemo(
            () =>
                props.icon ? (
                    <Icon
                        color={props.isActive ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
                        size={24}
                        icon={props.icon}
                    />
                ) : (
                    props.iconComponent
                ),
            [props.icon, props.iconComponent, theme, props.isActive],
        );

        const Content = useMemo(
            () => (
                <>
                    {iconComponent}
                    {props.indicator === 'alert' && (
                        <AlertDotWrapper>
                            <AlertDot />
                        </AlertDotWrapper>
                    )}
                    {props.indicator === 'loading' && (
                        <Indicator>
                            <FluidSpinner size={6} />
                        </Indicator>
                    )}
                    {props.indicator === 'check' && (
                        <Indicator>
                            <Icon icon="CHECK" size={10} color={theme.TYPE_GREEN} />
                        </Indicator>
                    )}
                </>
            ),
            [props.indicator, iconComponent, theme],
        );

        if (props.isMobileLayout) {
            return (
                <MobileWrapper {...props}>
                    <MobileIconWrapper isActive={props.isActive}>{Content}</MobileIconWrapper>
                    <Label>{props.label}</Label>
                </MobileWrapper>
            );
        }

        return (
            <HoverAnimation isHoverable={!props.isOpen}>
                <Wrapper isActive={props.isActive} isOpen={props.isOpen} ref={ref} {...props}>
                    {Content}
                </Wrapper>
            </HoverAnimation>
        );
    },
);
