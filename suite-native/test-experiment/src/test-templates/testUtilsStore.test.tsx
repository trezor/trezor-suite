import { renderHookWithStoreProvider } from '@suite-native/test-utils';

describe('with basic providers', () => {
    it('should render hook', () => {
        const { result } = renderHookWithStoreProvider(() => true);

        expect(result.current).toBe(true);
    });
});
