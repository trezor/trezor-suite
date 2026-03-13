import { useMemo } from 'react';
import { Provider } from 'react-redux';

import { renderHook } from '@testing-library/react-native';

import { initStore } from '@suite-native/state';

const StoreProviderForTests = ({ children }: Parameters<typeof Provider>[0]) => {
    const store = useMemo(() => {
        const { store: freshStore } = initStore();

        return freshStore;
    }, []);

    return <Provider store={store}>{children}</Provider>;
};

const renderHookWithProviders = <Result, Props>(callback: (props: Props) => Result) =>
    renderHook(callback, {
        wrapper: StoreProviderForTests,
    });

describe('with StoreProviderForTests', () => {
    it('should render hook', () => {
        const { result } = renderHookWithProviders(() => true);

        expect(result.current).toBe(true);
    });
});
