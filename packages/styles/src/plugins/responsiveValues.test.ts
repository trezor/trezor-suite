import { breakpointMediaQueries } from '../breakpoints';
import { makeResponsiveValuePlugin } from './responsiveValues';

describe('makeResponsiveValuePlugin', () => {
    const plugin = makeResponsiveValuePlugin();

    it('handles a style object without any responsive values', () => {
        expect(
            plugin({
                fontSize: '12px',
            }),
        ).toEqual({
            fontSize: '12px',
        });
    });

    it('handles a style object with a single non-xs responsive value', () => {
        expect(
            plugin({
                fontSize: {
                    sm: '12px',
                },
            }),
        ).toEqual({
            [breakpointMediaQueries.sm]: {
                fontSize: '12px',
            },
        });
    });

    it('handles a style object with an xs responsive value', () => {
        expect(
            plugin({
                fontSize: {
                    xs: '12px',
                },
            }),
        ).toEqual({
            fontSize: '12px',
        });
    });

    it('handles a style object with multiple non-xs responsive values', () => {
        expect(
            plugin({
                fontSize: {
                    sm: '12px',
                    md: '14px',
                },
            }),
        ).toEqual({
            [breakpointMediaQueries.sm]: {
                fontSize: '12px',
            },
            [breakpointMediaQueries.md]: {
                fontSize: '14px',
            },
        });
    });

    it('handles all responsive values at once', () => {
        expect(
            plugin({
                fontSize: {
                    xs: '10px',
                    sm: '12px',
                    md: '14px',
                    lg: '16px',
                    xl: '18px',
                    xxl: '20px',
                },
            }),
        ).toEqual({
            fontSize: '10px',
            [breakpointMediaQueries.sm]: {
                fontSize: '12px',
            },
            [breakpointMediaQueries.md]: {
                fontSize: '14px',
            },
            [breakpointMediaQueries.lg]: {
                fontSize: '16px',
            },
            [breakpointMediaQueries.xl]: {
                fontSize: '18px',
            },
            [breakpointMediaQueries.xxl]: {
                fontSize: '20px',
            },
        });
    });

    it('preserves media queries', () => {
        expect(
            plugin({
                // @ts-expect-error
                '@media print': {
                    fontSize: '12px',
                },
            }),
        ).toEqual({
            '@media print': {
                fontSize: '12px',
            },
        });
    });

    it('handles responsive values in media queries', () => {
        expect(
            plugin({
                // @ts-expect-error
                '@media print': {
                    fontSize: {
                        sm: '12px',
                    },
                },
            }),
        ).toEqual({
            '@media print': {
                [breakpointMediaQueries.sm]: {
                    fontSize: '12px',
                },
            },
        });
    });

    it('preserves pseudo-class selectors', () => {
        expect(
            plugin({
                // @ts-expect-error
                '&:hover': {
                    fontSize: '12px',
                },
            }),
        ).toEqual({
            '&:hover': {
                fontSize: '12px',
            },
        });
    });

    it('handles responsive values in pseudo-class selectors', () => {
        expect(
            plugin({
                // @ts-expect-error
                '&:hover': {
                    fontSize: {
                        sm: '12px',
                    },
                },
            }),
        ).toEqual({
            '&:hover': {
                [breakpointMediaQueries.sm]: {
                    fontSize: '12px',
                },
            },
        });
    });

    it('preserves keyframes', () => {
        expect(
            plugin({
                animationName: {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
            }),
        ).toEqual({
            animationName: {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
            },
        });
    });
});
