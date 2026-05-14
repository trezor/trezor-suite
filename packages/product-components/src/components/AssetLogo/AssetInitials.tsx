import styled from 'styled-components';

import { ElevationUp, Text, Tooltip, useElevation } from '@trezor/components';
import {
    type Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

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
    withTooltip?: boolean;
    size: number;
};

const AssetInitialsInner = ({ children, size, withTooltip = true }: AssetInitialsProps) => {
    const { elevation } = useElevation();
    const firstChar = children[0];

    return (
        <Circle $elevation={elevation} $size={size}>
            <Content>
                {withTooltip ? (
                    <Tooltip content={children}>
                        <Text typographyStyle="body-sm-strong">{firstChar}</Text>
                    </Tooltip>
                ) : (
                    <Text typographyStyle="body-sm-strong">{firstChar}</Text>
                )}
            </Content>
        </Circle>
    );
};

export const AssetInitials = ({ children, ...rest }: AssetInitialsProps) => (
    <ElevationUp>
        <AssetInitialsInner {...rest}>{children}</AssetInitialsInner>
    </ElevationUp>
);
