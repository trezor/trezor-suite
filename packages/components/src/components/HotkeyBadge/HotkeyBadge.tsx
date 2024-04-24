import {
    Elevation,
    borders,
    mapElevationToBackground,
    spacingsPx,
    typography,
} from '@trezor/theme';
import styled from 'styled-components';
import { ElevationDown, useElevation } from '../ElevationContext/ElevationContext';

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
    children: string;
}
const Component = ({ isActive = true, children }: HotkeyBadgeProps) => {
    const { elevation } = useElevation();

    const isMac = navigator.userAgent.includes('Macintosh');

    const split = children.split(/(\+)/g).map(x => x.trim());
    const hotkeyReplaces: Record<string, string> = {
        MOD: isMac ? '⌘' : 'CTRL',
        ALT: isMac ? 'Option' : 'ALT',
    };

    return (
        <Container $elevation={elevation} $isActive={isActive}>
            {split.map(hotkey => (
                <span key={`hotkey-${hotkey}`}>{hotkeyReplaces[hotkey] || hotkey}</span>
            ))}
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
