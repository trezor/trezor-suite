import styled from 'styled-components';
import { ElevationUp, useElevation } from '../ElevationContext/ElevationContext';
import {
    borders,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';
import { Text } from '../typography/Text/Text';
import { Tooltip } from '../Tooltip/Tooltip';

const Content = styled.div`
    margin: ${spacingsPx.xxs};
    overflow: hidden;
`;

const Circle = styled.div<{ $size: number; $elevation: Elevation }>`
    border-radius: ${borders.radii.full};
    align-items: center;
    justify-content: center;
    display: flex;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border: solid 1px ${mapElevationToBorder};
    background-color: ${mapElevationToBackground};
`;
type AssetInitialsProps = {
    children: string;
    size: number;
};

const AssetInitialsInner = ({ children, size }: AssetInitialsProps) => {
    const { elevation } = useElevation();

    return (
        <Circle $elevation={elevation} $size={size}>
            <Content>
                <Tooltip content={children}>
                    <Text typographyStyle="callout">{children[0]}</Text>
                </Tooltip>
            </Content>
        </Circle>
    );
};

export const AssetInitials = ({ children, ...rest }: AssetInitialsProps) => (
    <ElevationUp>
        <AssetInitialsInner {...rest}>{children}</AssetInitialsInner>
    </ElevationUp>
);
