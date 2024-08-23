import { useMemo, ReactNode, HTMLAttributes } from 'react';
import styled, { useTheme } from 'styled-components';
import { IconLegacy, IconLegacyProps, variables } from '@trezor/components';
import { FADE_IN } from '@trezor/components/src/config/animations';

const MobileWrapper = styled.div`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;

    & + & {
        border-top: 1px solid ${({ theme }) => theme.borderElevation2};
    }
`;

const MobileIconWrapper = styled.div`
    display: flex;
    position: relative;
    cursor: pointer;
    align-items: center;
    margin-right: 16px;
`;

const Label = styled.span<{ $isActive?: boolean }>`
    padding: 16px 8px;
    color: ${({ theme, $isActive }) => ($isActive ? theme.textDefault : theme.textSubdued)};
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
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
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
    background: ${({ theme }) => theme.iconAlertYellow};
`;

const Indicator = styled.div`
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
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

export type IndicatorStatus = 'check' | 'alert';

interface CommonProps extends Pick<HTMLAttributes<HTMLDivElement>, 'onClick'> {
    label: ReactNode;
    isActive?: boolean;
    indicator?: IndicatorStatus;
    'data-testid'?: string;
}

interface CustomIconComponentProps extends CommonProps {
    iconComponent: ReactNode;
    icon?: never;
}
interface IconComponentProps extends CommonProps {
    icon: IconLegacyProps['icon'];
    iconComponent?: never;
}

type MobileActionItemProps = CustomIconComponentProps | IconComponentProps;

// Reason to use forwardRef: We want the user to be able to close Notifications dropdown by clicking somewhere else.
// In order to achieve that behavior, we need to pass reference to MobileActionItem
export const MobileActionItem = ({
    icon,
    iconComponent,
    indicator,
    isActive,
    label,
    onClick,
    'data-testid': dataTest,
}: MobileActionItemProps) => {
    const theme = useTheme();

    const IconComponent = useMemo(
        () =>
            icon ? (
                <IconLegacy
                    color={isActive ? theme.textDefault : theme.textSubdued}
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
                {indicator === 'check' && (
                    <Indicator>
                        <IconLegacy icon="CHECK" size={10} color={theme.legacy.TYPE_GREEN} />
                    </Indicator>
                )}
            </>
        ),
        [indicator, IconComponent, theme],
    );

    return (
        <MobileWrapper data-testid={dataTest} onClick={onClick}>
            <MobileIconWrapper>{Content}</MobileIconWrapper>
            <Label $isActive={isActive}>{label}</Label>
        </MobileWrapper>
    );
};
