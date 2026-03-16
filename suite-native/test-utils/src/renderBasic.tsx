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
        wrapper: Wrapper,
        ...options
    }: RenderOptions & {
        formattersConfig?: FormatterProviderConfig;
    } = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });

export const renderHookWithBasicProvider = <Result, Props>(
    callback: (props: Props) => Result,
    {
        formattersConfig,
        wrapper: Wrapper,
        ...options
    }: RenderHookOptions<Props> & {
        formattersConfig?: FormatterProviderConfig;
    } = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });
