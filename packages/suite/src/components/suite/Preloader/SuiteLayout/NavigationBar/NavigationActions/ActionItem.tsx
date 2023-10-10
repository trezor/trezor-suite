import { useMemo, Ref, forwardRef, ReactNode, HTMLAttributes } from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon, IconProps, variables, Spinner, Tooltip } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

import { HoverAnimation } from 'src/components/suite';

const Wrapper = styled.div<{
    $isOpen: ActionItemProps['isOpen'];
    $marginLeft: ActionItemProps['marginLeft'];
}>`
    width: 44px;
    height: 44px;
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    margin-left: ${({ $marginLeft }) => $marginLeft && '8px'};
    background: ${({ $isOpen, theme }) => $isOpen && theme.BG_GREY_OPEN};
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

const MobileIconWrapper = styled.div`
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

interface CommonProps extends Pick<HTMLAttributes<HTMLDivElement>, 'onClick'> {
    label: ReactNode;
    isActive?: boolean;
    isOpen?: boolean;
    indicator?: IndicatorStatus;
    isMobileLayout?: boolean;
    marginLeft?: boolean;
    'data-test'?: string;
}

interface CustomIconComponentProps extends CommonProps {
    iconComponent: ReactNode;
    icon?: never;
}
interface IconComponentProps extends CommonProps {
    icon: IconProps['icon'];
    iconComponent?: never;
}

type ActionItemProps = CustomIconComponentProps | IconComponentProps;

// Reason to use forwardRef: We want the user to be able to close Notifications dropdown by clicking somewhere else.
// In order to achieve that behavior, we need to pass reference to ActionItem
export const ActionItem = forwardRef(
    (
        {
            icon,
            iconComponent,
            indicator,
            isActive,
            isMobileLayout,
            isOpen,
            label,
            marginLeft,
            onClick,
            'data-test': dataTest,
        }: ActionItemProps,
        ref: Ref<HTMLDivElement>,
    ) => {
        const theme = useTheme();

        const IconComponent = useMemo(
            () =>
                icon ? (
                    <Icon
                        color={isActive ? theme.TYPE_DARK_GREY : theme.TYPE_LIGHT_GREY}
                        size={24}
                        icon={icon}
                    />
                ) : (
                    iconComponent
                ),
            [icon, iconComponent, theme, isActive],
        );

        const Content = useMemo(
            () => (
                <>
                    {IconComponent}
                    {indicator === 'alert' && (
                        <AlertDotWrapper>
                            <AlertDot />
                        </AlertDotWrapper>
                    )}
                    {indicator === 'loading' && (
                        <Indicator>
                            <Spinner size={6} />
                        </Indicator>
                    )}
                    {indicator === 'check' && (
                        <Indicator>
                            <Icon icon="CHECK" size={10} color={theme.TYPE_GREEN} />
                        </Indicator>
                    )}
                </>
            ),
            [indicator, IconComponent, theme],
        );

        if (isMobileLayout) {
            return (
                <MobileWrapper data-test={dataTest} onClick={onClick}>
                    <MobileIconWrapper>{Content}</MobileIconWrapper>
                    <Label>{label}</Label>
                </MobileWrapper>
            );
        }

        return (
            <Tooltip
                cursor="default"
                maxWidth={200}
                delay={[600, 0]}
                placement="bottom"
                interactive={false}
                hideOnClick={false}
                content={label}
            >
                <HoverAnimation isHoverable={!isOpen}>
                    <Wrapper
                        ref={ref}
                        data-test={dataTest}
                        onClick={onClick}
                        $isOpen={isOpen}
                        $marginLeft={marginLeft}
                    >
                        {Content}
                    </Wrapper>
                </HoverAnimation>
            </Tooltip>
        );
    },
);
