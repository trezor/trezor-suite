import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react-native';

import type { FormatterProviderConfig } from '@suite-common/formatters';

import { ALL_PROVIDERS, ProviderForTests, type ProviderKey } from './BasicProviderForTests';

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

export const renderWithBasicProvider = <Props,>(
    element: ReactElement<Props>,
    options: RenderOptions & { formattersConfig?: FormatterProviderConfig } = {},
) => renderWithProviders(element, { providers: ALL_PROVIDERS, ...options });

export const renderHookWithBasicProvider = <Result, Props>(
    callback: (props: Props) => Result,
    options: RenderHookOptions<Props> & { formattersConfig?: FormatterProviderConfig } = {},
) => renderHookWithProviders(callback, { providers: ALL_PROVIDERS, ...options });
