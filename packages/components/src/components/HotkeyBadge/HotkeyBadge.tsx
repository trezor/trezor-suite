import { Fragment } from 'react';

import styled from 'styled-components';

import {
    Elevation,
    borders,
    mapElevationToBackground,
    spacingsPx,
    typography,
} from '@trezor/theme';

import { ElevationDown, useElevation } from '../ElevationContext/ElevationContext';
import { Keys, keyboardKeys } from './keyboardKeys';

export const Container = styled.div<{ $elevation: Elevation; $isActive: boolean }>`
    display: flex;
    gap: ${spacingsPx.xxs};
    align-items: center;
    justify-content: center;
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.xs};
    color: ${({ theme }) => theme.textSubdued};
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};
    user-select: none;
    padding: 0 ${spacingsPx.xxs};
    ${typography.label}
    position: relative;
`;

export interface HotkeyBadgeProps {
    isActive?: boolean;
    hotkey: Array<Keys>;
}

const Plus = () => <span>+</span>;

const Component = ({ isActive = true, hotkey }: HotkeyBadgeProps) => {
    const { elevation } = useElevation();

    const isMac = navigator.userAgent.includes('Macintosh');

    return (
        <Container $elevation={elevation} $isActive={isActive}>
            {hotkey.map((key, index) => {
                const keyObject = keyboardKeys[key];
                const macValue = 'valueMac' in keyObject ? keyObject.valueMac : keyObject.value;
                const isNotLast = index < hotkey.length - 1;
                const value = isMac ? macValue : keyObject.value;

                return (
                    <Fragment key={`hotkey-${key}-${index}`}>
                        <span>{value.toUpperCase()}</span>
                        {isNotLast && <Plus />}
                    </Fragment>
                );
            })}
        </Container>
    );
};

export const HotkeyBadge = (props: HotkeyBadgeProps) => {
    return (
        <ElevationDown>
            <Component {...props} />
        </ElevationDown>
    );
};
