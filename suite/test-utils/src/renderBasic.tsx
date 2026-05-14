import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react';

import { BasicProviderForTests } from './BasicProviderForTests';

export const renderWithBasicProvider = <Props,>(
    element: ReactElement<Props>,
    { wrapper: Wrapper, ...options }: RenderOptions & {} = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <BasicProviderForTests>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });

export const renderHookWithBasicProvider = <Result, Props>(
    callback: (props: Props) => Result,
    { wrapper: Wrapper, ...options }: RenderHookOptions<Props> & {} = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <BasicProviderForTests>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });
