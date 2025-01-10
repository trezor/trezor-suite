import { ReactElement } from 'react';

import { render as origRender } from '@testing-library/react-native';

import { Provider } from './Provider';

type Parameters<TParams> = TParams extends (...args: infer TParamsInferred) => any
    ? TParamsInferred
    : never;

export const render = (
    element: ReactElement,
    { wrapper: WrapperComponent, ...options }: Parameters<typeof origRender>[1] = {},
): ReturnType<typeof origRender> => {
    const wrapperWithProvider = WrapperComponent
        ? ({ children }: { children: ReactElement }) => (
              <Provider>
                  <WrapperComponent>{children}</WrapperComponent>
              </Provider>
          )
        : Provider;

    return origRender(element, {
        wrapper: wrapperWithProvider,
        ...options,
    });
};

export {
    act,
    cleanup,
    fireEvent,
    renderHook,
    screen,
    waitFor,
    waitForElementToBeRemoved,
} from '@testing-library/react-native';
