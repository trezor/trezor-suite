import React from 'react';
import styled from 'styled-components';
import { useTheme, Icon, IconProps, variables } from '@trezor/components';

const Wrapper = styled.div<Pick<Props, 'isActive' | 'desktopMarginLeft' | 'desktopMarginRight'>>`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    margin-left: ${props => props.desktopMarginLeft || '0px'};
    margin-right: ${props => props.desktopMarginRight || '0px'};
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
    top: 0px;
    right: 2px;
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

interface CommonProps extends Pick<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    label: React.ReactNode;
    isActive?: boolean;
    withAlertDot?: boolean;
    isMobileLayout?: boolean;
    desktopMarginLeft?: string;
    desktopMarginRight?: string;
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
                    {props.withAlertDot && (
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
        <Wrapper isActive={props.isActive} {...props} ref={ref}>
            {iconComponent}
            {props.withAlertDot && (
                <AlertDotWrapper>
                    <AlertDot />
                </AlertDotWrapper>
            )}
        </Wrapper>
    );
});
export default ActionItem;
