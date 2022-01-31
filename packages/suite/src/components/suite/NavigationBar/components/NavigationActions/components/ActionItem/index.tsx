import React from 'react';
import styled, { css } from 'styled-components';
import { useTheme, Icon, IconProps, variables, HoverAnimation } from '@trezor/components';

const Wrapper = styled.div<Pick<Props, 'isOpen' | 'marginLeft'>>`
    width: 45px;
    height: 45px;
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    ${props => props.marginLeft && `margin-left: 8px`};
    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    ${props =>
        props.isOpen &&
        css`
            background: ${props.theme.BG_GREY_OPEN};
        `}
`;

const MobileWrapper = styled.div<Pick<Props, 'isActive'>>`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    margin-right: 16px;

    & + & {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
    }
`;

const MobileIconWrapper = styled.div<Pick<Props, 'isActive'>>`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    margin-right: 16px;
`;

const Label = styled.span`
    padding: 16px 8px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const AlertDotWrapper = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.theme.BG_WHITE};
`;

const AlertDot = styled.div`
    position: relative;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => props.theme.TYPE_ORANGE};
`;

const Indicator = styled.div`
    background: ${props => props.theme.BG_WHITE};
    display: flex;
    align-items: center;
    height: 10px;
    width: 10px;
    border-radius: 50%;
    position: absolute;
    top: 0px;
    right: -1px;
`;

interface CommonProps extends Pick<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    label: React.ReactNode;
    isActive?: boolean;
    isOpen?: boolean;
    indicator?: 'check' | 'alert';
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

type Props = CustomIconComponentProps | IconComponentProps;

// Reason to use forwardRef: We want the user to be able to close Notifications dropdown by clicking somewhere else.
// In order to achieve that behavior, we need to pass reference to ActionItem
const ActionItem = React.forwardRef((props: Props, ref: React.Ref<HTMLDivElement>) => {
    const theme = useTheme();
    const iconComponent = props.icon ? (
        <Icon
            color={props.isActive ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
            size={24}
            icon={props.icon}
        />
    ) : (
        props.iconComponent
    );

    if (props.isMobileLayout) {
        return (
            <MobileWrapper {...props}>
                <MobileIconWrapper isActive={props.isActive}>
                    {iconComponent}
                    {props.indicator === 'alert' && (
                        <AlertDotWrapper>
                            <AlertDot />
                        </AlertDotWrapper>
                    )}
                </MobileIconWrapper>
                <Label>{props.label}</Label>
            </MobileWrapper>
        );
    }

    return (
        <Wrapper isActive={props.isActive} isOpen={props.isOpen} {...props} ref={ref}>
            <HoverAnimation isHoverable={!props.isOpen}>
                {iconComponent}
                {props.indicator === 'alert' && (
                    <AlertDotWrapper>
                        <AlertDot />
                    </AlertDotWrapper>
                )}
                {props.indicator === 'check' && (
                    <Indicator>
                        <Icon icon="CHECK" size={10} color={theme.TYPE_GREEN} />
                    </Indicator>
                )}
            </HoverAnimation>
        </Wrapper>
    );
});
export default ActionItem;
