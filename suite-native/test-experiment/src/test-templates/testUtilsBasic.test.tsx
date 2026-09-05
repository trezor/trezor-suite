import { renderHookWithBasicProvider } from '@suite-native/test-utils';

describe('with basic providers', () => {
    it('should render hook', () => {
        const { result } = renderHookWithBasicProvider(() => true);

        expect(result.current).toBe(true);
    });
});
