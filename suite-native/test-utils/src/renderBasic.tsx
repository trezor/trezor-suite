import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react-native';

import type { FormatterProviderConfig } from '@suite-common/formatters';

import { BasicProviderForTests } from './BasicProviderForTests';

export const renderWithBasicProvider = <Props,>(
    element: ReactElement<Props>,
    {
        formattersConfig,
        services,
        wrapper: Wrapper,
        ...options
    }: RenderOptions & {
        formattersConfig?: FormatterProviderConfig;
        services?: Record<string, unknown>;
    } = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig} services={services}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });

export const renderHookWithBasicProvider = <Result, Props>(
    callback: (props: Props) => Result,
    {
        formattersConfig,
        services,
        wrapper: Wrapper,
        ...options
    }: RenderHookOptions<Props> & {
        formattersConfig?: FormatterProviderConfig;
        services?: Record<string, unknown>;
    } = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig} services={services}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });
