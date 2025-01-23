import { ReactElement } from 'react';

import { render, RenderOptions } from '@testing-library/react-native';

import { PreloadedState } from '@suite-native/state';

type ProviderProps = {
    preloadedState?: PreloadedState;
} & RenderOptions;

export const createRender =
    (Provider: NonNullable<RenderOptions['wrapper']>) =>
    <T,>(
        element: ReactElement<T>,
        { wrapper: WrapperComponent, preloadedState, ...options }: ProviderProps = {},
    ) => {
        const wrapperWithProvider = ({ children }: { children: ReactElement }) => (
            <Provider preloadedState={preloadedState}>
                {WrapperComponent ? <WrapperComponent>{children}</WrapperComponent> : children}
            </Provider>
        );

        return render(element, {
            wrapper: wrapperWithProvider,
            ...options,
        });
    };
