import { makeTypedSelectorsPlugin } from './typedSelectors';

describe('makeTypedSelectorsPlugin', () => {
    const plugin = makeTypedSelectorsPlugin();

    it('handles a style object without selectors property', () => {
        expect(
            plugin({
                fontSize: '12px',
            }),
        ).toEqual({
            fontSize: '12px',
        });
    });

    it('handles a style object with a selectors property', () => {
        expect(
            plugin({
                fontSize: '12px',
                selectors: {
                    '&:hover': {
                        fontSize: '14px',
                    },
                },
            }),
        ).toEqual({
            fontSize: '12px',
            '&:hover': {
                fontSize: '14px',
            },
        });
    });

    it('handles a style object with nested selectors', () => {
        expect(
            plugin({
                fontSize: '12px',
                selectors: {
                    '&:hover': {
                        fontSize: '14px',
                        selectors: {
                            '&:active': {
                                fontSize: '16px',
                            },
                        },
                    },
                },
            }),
        ).toEqual({
            fontSize: '12px',
            '&:hover': {
                fontSize: '14px',
                '&:active': {
                    fontSize: '16px',
                },
            },
        });
    });
});
