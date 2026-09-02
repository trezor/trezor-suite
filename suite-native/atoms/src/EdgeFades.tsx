import { useMemo } from 'react';

import { LinearGradient } from 'expo-linear-gradient';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

export type EdgeFadesDirection = 'horizontal' | 'vertical';

type EdgeFadeStyleProps = {
    direction: EdgeFadesDirection;
    edge: 'start' | 'end';
    size: number;
};

const edgeFadeStyle = prepareNativeStyle<EdgeFadeStyleProps>((_, { direction, edge, size }) => ({
    position: 'absolute',
    pointerEvents: 'none',
    extend: [
        {
            condition: direction === 'horizontal',
            style: {
                top: 0,
                bottom: 0,
                width: size,
            },
        },
        {
            condition: direction === 'vertical',
            style: {
                left: 0,
                right: 0,
                height: size,
            },
        },
        {
            condition: direction === 'horizontal' && edge === 'start',
            style: {
                left: 0,
            },
        },
        {
            condition: direction === 'horizontal' && edge === 'end',
            style: {
                right: 0,
            },
        },
        {
            condition: direction === 'vertical' && edge === 'start',
            style: {
                top: 0,
            },
        },
        {
            condition: direction === 'vertical' && edge === 'end',
            style: {
                bottom: 0,
            },
        },
    ],
}));

type EdgeFadesProps = {
    direction: EdgeFadesDirection;
    startSize: number;
    endSize?: number;
    testID?: string;
};

const edgeNames = {
    horizontal: {
        start: 'left',
        end: 'right',
    },
    vertical: {
        start: 'top',
        end: 'bottom',
    },
} as const;

const gradientPoints = {
    horizontal: {
        start: {
            start: { x: 1, y: 0.5 },
            end: { x: 0, y: 0.5 },
        },
        end: {
            start: { x: 0, y: 0.5 },
            end: { x: 1, y: 0.5 },
        },
    },
    vertical: {
        start: {
            start: { x: 0.5, y: 1 },
            end: { x: 0.5, y: 0 },
        },
        end: {
            start: { x: 0.5, y: 0 },
            end: { x: 0.5, y: 1 },
        },
    },
} as const;

export const EdgeFades = ({
    direction,
    startSize,
    endSize = startSize,
    testID,
}: EdgeFadesProps) => {
    const { applyStyle, utils } = useNativeStyles();

    const colors = useMemo<[string, string, string, string]>(() => {
        const backgroundColor = utils.colors.surfaceFillPage;

        return [
            hexToRgba(backgroundColor, 0.01),
            hexToRgba(backgroundColor, 0.45),
            hexToRgba(backgroundColor, 0.85),
            backgroundColor,
        ];
    }, [utils.colors.surfaceFillPage]);

    const startEdgeName = edgeNames[direction].start;
    const endEdgeName = edgeNames[direction].end;

    return (
        <>
            <LinearGradient
                start={gradientPoints[direction].start.start}
                end={gradientPoints[direction].start.end}
                colors={colors}
                locations={[0, 0.45, 0.8, 1]}
                style={applyStyle(edgeFadeStyle, {
                    direction,
                    edge: 'start',
                    size: startSize,
                })}
                testID={testID ? `${testID}/${startEdgeName}` : undefined}
            />
            <LinearGradient
                start={gradientPoints[direction].end.start}
                end={gradientPoints[direction].end.end}
                colors={colors}
                locations={[0, 0.45, 0.8, 1]}
                style={applyStyle(edgeFadeStyle, {
                    direction,
                    edge: 'end',
                    size: endSize,
                })}
                testID={testID ? `${testID}/${endEdgeName}` : undefined}
            />
        </>
    );
};
