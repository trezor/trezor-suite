import { useState } from 'react';

import styled from 'styled-components';

import { Column, Icon, Row, Text } from '@trezor/components';
import { CSSColor, borders, colorVariants, spacings, spacingsPx, zIndices } from '@trezor/theme';

const DebugLegendContainer = styled.div`
    position: absolute;
    right: 0;
    bottom: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    border-radius: ${borders.radii.xs};
    margin: ${spacingsPx.xxxs};
    padding: ${spacingsPx.xxs};
    z-index: ${zIndices.guideButton};
    cursor: pointer;
    user-select: none;
`;

const Badge = styled.div<{ $fill: CSSColor; $stroke: CSSColor }>`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ $fill }) => $fill};
    border: solid 1px ${({ $stroke }) => $stroke};
`;

type MapDebugElevationType = Record<string, { border: CSSColor; background: CSSColor }>;

const mapDebugElevations: MapDebugElevationType = {
    'Elevation -1': {
        background: colorVariants.debug.backgroundSurfaceElevationNegative,
        border: colorVariants.debug.borderElevationNegative,
    },
    'Elevation 0': {
        background: colorVariants.debug.backgroundSurfaceElevation0,
        border: colorVariants.debug.borderElevation0,
    },
    'Elevation 1': {
        background: colorVariants.debug.backgroundSurfaceElevation1,
        border: colorVariants.debug.borderElevation1,
    },
    'Elevation 2': {
        background: colorVariants.debug.backgroundSurfaceElevation2,
        border: colorVariants.debug.borderElevation2,
    },
    'Elevation 3': {
        background: colorVariants.debug.backgroundSurfaceElevation3,
        border: colorVariants.debug.borderElevation3,
    },
} as const;

export const DebugLegend = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <DebugLegendContainer onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen && (
                <>
                    <Column
                        justifyContent="center"
                        gap={spacings.xs}
                        margin={{ bottom: spacings.xs }}
                    >
                        {Object.keys(mapDebugElevations).map(key => (
                            <Row key={key} gap={spacings.xs}>
                                <Badge
                                    $fill={mapDebugElevations[key].background}
                                    $stroke={mapDebugElevations[key].border}
                                />
                                <Text typographyStyle="label">{key}</Text>
                            </Row>
                        ))}
                    </Column>
                </>
            )}
            <Row gap={spacings.xs}>
                <Text typographyStyle="label">Debug theme legend</Text>
                <Icon name={isMenuOpen ? 'caretDown' : 'caretUp'} size="medium" />
            </Row>
        </DebugLegendContainer>
    );
};
