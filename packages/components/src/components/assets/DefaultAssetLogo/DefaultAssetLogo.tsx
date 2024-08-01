import { borders } from '@trezor/theme';
import styled from 'styled-components';

const DEFAULT_CHARACTER = '?';

type DefaultAssetLogoProps = {
    coinFirstCharacter?: string;
    size?: number;
};

const DefaultWrapper = styled.div<{ $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border-radius: ${borders.radii.full};
    color: ${({ theme }) => theme.iconSubdued};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation0};
    font-weight: bold;
    font-size: ${({ $size }) => $size * 0.75}px;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

export const DefaultAssetLogo = ({
    coinFirstCharacter = DEFAULT_CHARACTER,
    size = 32,
}: DefaultAssetLogoProps) => <DefaultWrapper $size={size}>{coinFirstCharacter}</DefaultWrapper>;
