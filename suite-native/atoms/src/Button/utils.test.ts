import { colorVariants } from '@trezor/theme';

import { BUTTON_INTENTS, BUTTON_PRIORITIES } from './types';
import { getButtonColors, getTextButtonColor, getTextButtonDisabledColor } from './utils';

describe.each(BUTTON_INTENTS)('%s button colors', intent => {
    it.each(BUTTON_PRIORITIES)(
        'resolves every %s color in both themes and orientations',
        priority => {
            for (const colors of Object.values(colorVariants)) {
                for (const isInverse of [false, true]) {
                    for (const isDisabled of [false, true]) {
                        const tokens = getButtonColors({ intent, priority, isInverse, isDisabled });
                        Object.values(tokens).forEach(token => expect(colors[token]).toMatch(/^#/));
                    }
                    for (const isPressed of [false, true]) {
                        expect(
                            colors[getTextButtonColor({ intent, priority, isInverse, isPressed })],
                        ).toMatch(/^#/);
                    }
                }
            }
        },
    );
});

describe('debug intent', () => {
    it('uses pink for both priorities and their pressed state', () => {
        expect(getButtonColors({ intent: 'debug', isDisabled: false })).toEqual({
            backgroundColor: 'elementFillDebugBold',
            onPressColor: 'elementFillDebugBoldPressed',
            contentColor: 'contentButtonDebugPrimary',
        });
        expect(
            getButtonColors({ intent: 'debug', priority: 'secondary', isDisabled: false }),
        ).toEqual({
            backgroundColor: 'elementFillDebugSoft',
            onPressColor: 'elementFillDebugSoftPressed',
            contentColor: 'contentDebug',
        });
    });

    it('keeps the usual disabled colors', () => {
        for (const priority of BUTTON_PRIORITIES) {
            for (const isInverse of [false, true]) {
                expect(
                    getButtonColors({ intent: 'debug', priority, isInverse, isDisabled: true }),
                ).toEqual(
                    getButtonColors({ intent: 'brand', priority, isInverse, isDisabled: true }),
                );
                expect(getTextButtonDisabledColor(isInverse)).toBe(
                    isInverse ? 'contentOnDarkDisabled' : 'contentDisabled',
                );
            }
        }
    });
});
