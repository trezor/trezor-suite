import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react-native';

import type { FormatterProviderConfig } from '@suite-common/formatters';

import { ProviderForTests, type ProviderKey } from './ProviderForTests';

type ExtraOptions = {
    providers?: ProviderKey[];
    formattersConfig?: FormatterProviderConfig;
};

export const renderWithProviders = <Props,>(
    element: ReactElement<Props>,
    {
        providers,
        formattersConfig,
        wrapper: Wrapper,
        ...options
    }: RenderOptions & ExtraOptions = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <ProviderForTests providers={providers} formattersConfig={formattersConfig}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </ProviderForTests>
        ),
        ...options,
    });

export const renderHookWithProviders = <Result, Props>(
    callback: (props: Props) => Result,
    {
        providers,
        formattersConfig,
        wrapper: Wrapper,
        ...options
    }: RenderHookOptions<Props> & ExtraOptions = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <ProviderForTests providers={providers} formattersConfig={formattersConfig}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </ProviderForTests>
        ),
        ...options,
    });
