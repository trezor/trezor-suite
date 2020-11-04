import { colors, Icon, IconProps, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div<Pick<Props, 'isActive'>>`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;

    & + & {
        margin-left: 28px;
    }
`;

const MobileWrapper = styled.div<Pick<Props, 'isActive'>>`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    margin-right: 16px;

    & + & {
        border-top: 1px solid ${colors.NEUE_STROKE_GREY};
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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
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
    background: ${colors.NEUE_BG_WHITE};
`;

const AlertDot = styled.div`
    position: relative;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${colors.NEUE_TYPE_RED};
`;

// The Icon can be switched dynamically (e.g. Discreet mode icon) and without fixed size the whole row of NavigationActions jumps on the first switch
const StyledIcon = styled(Icon)`
    width: 24px;
    height: 24px;
`;

interface CommonProps extends Pick<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    label: React.ReactNode;
    isActive?: boolean;
    withAlertDot?: boolean;
    isMobileLayout?: boolean;
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

const ActionItem = (props: Props) => {
    const iconComponent = props.icon ? (
        <StyledIcon
            color={props.isActive ? colors.NEUE_TYPE_DARK_GREY : colors.NEUE_TYPE_LIGHT_GREY}
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
        <Wrapper isActive={props.isActive} {...props}>
            {iconComponent}
            {props.withAlertDot && (
                <AlertDotWrapper>
                    <AlertDot />
                </AlertDotWrapper>
            )}
        </Wrapper>
    );
};

export default ActionItem;
