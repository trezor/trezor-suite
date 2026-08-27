import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderHookResult,
    type RenderOptions,
    type RenderResult,
    render,
    renderHook,
} from '@testing-library/react-native';

import type { FormatterProviderConfig } from '@suite-common/formatters';

import { BasicProviderForTests } from './BasicProviderForTests';

export const renderWithBasicProvider = async <Props,>(
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
): Promise<RenderResult> =>
    await render(element, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig} services={services}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });

export const renderHookWithBasicProvider = async <Result, Props>(
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
): Promise<RenderHookResult<Result, Props>> =>
    await renderHook(callback, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig} services={services}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });
