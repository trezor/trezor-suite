import { colors, Icon, IconProps } from '@trezor/components';
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

interface CommonProps extends Pick<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    isActive?: boolean;
    withAlertDot?: boolean;
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
        <Icon
            color={props.isActive ? colors.NEUE_TYPE_DARK_GREY : colors.NEUE_TYPE_LIGHT_GREY}
            size={24}
            icon={props.icon}
        />
    ) : (
        props.iconComponent
    );

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
