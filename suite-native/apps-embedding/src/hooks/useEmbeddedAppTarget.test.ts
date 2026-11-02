import { isDevelopOrDebugEnv } from '@suite-native/config';
import { localeInitialState } from '@suite-native/intl';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useEmbeddedAppTarget } from './useEmbeddedAppTarget';
import { type EmbeddedAppTarget } from '../types';

jest.mock('@suite-native/config', () => ({
    ...jest.requireActual('@suite-native/config'),
    isDevelopOrDebugEnv: jest.fn(),
}));

const preloadedState = { locale: localeInitialState };

const renderUseEmbeddedAppTarget = (target: EmbeddedAppTarget) => {
    const onEvent = jest.fn();
    const rendered = renderHookWithStoreProvider(() => useEmbeddedAppTarget({ target, onEvent }), {
        preloadedState,
    });

    return rendered.then(result => ({ ...result, onEvent }));
};

describe(useEmbeddedAppTarget.name, () => {
    beforeEach(() => {
        jest.mocked(isDevelopOrDebugEnv).mockReturnValue(true);
    });

    it('should open a catalog entry and report nothing', async () => {
        const { result, onEvent } = await renderUseEmbeddedAppTarget({
            kind: 'catalog-entry',
            entryId: 'example-com',
        });

        expect(result.current?.url).toBe('https://example.com/');
        expect(onEvent).not.toHaveBeenCalled();
    });

    it('should report an entry the catalog does not know as a failed load, once', async () => {
        const { result, onEvent, rerender } = await renderUseEmbeddedAppTarget({
            kind: 'catalog-entry',
            entryId: 'not-in-the-catalog',
        });
        rerender(undefined);

        expect(result.current).toBeNull();
        expect(onEvent).toHaveBeenCalledTimes(1);
        expect(onEvent).toHaveBeenCalledWith({
            type: 'load-failed',
            detail: 'catalog entry "not-in-the-catalog" is not in the catalog',
        });
    });

    it('should open a custom url in a develop or debug build', async () => {
        const { result, onEvent } = await renderUseEmbeddedAppTarget({
            kind: 'custom-url',
            url: 'https://example.com/custom',
        });

        expect(result.current?.url).toBe('https://example.com/custom');
        expect(onEvent).not.toHaveBeenCalled();
    });

    it('should report a custom url outside develop and debug builds as a failed load', async () => {
        jest.mocked(isDevelopOrDebugEnv).mockReturnValue(false);

        const { result, onEvent } = await renderUseEmbeddedAppTarget({
            kind: 'custom-url',
            url: 'https://example.com/custom',
        });

        expect(result.current).toBeNull();
        expect(onEvent).toHaveBeenCalledTimes(1);
        expect(onEvent).toHaveBeenCalledWith({
            type: 'load-failed',
            detail: 'custom url https://example.com/custom is refused outside develop and debug builds',
        });
    });
});
