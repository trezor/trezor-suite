import type { Branded } from '@trezor/type-utils';

export type NativeNetworkReducerKey = string & Branded<'NativeNetworkReducerKey'>;

export const asNativeNetworkReducerKey = <TKey extends string>(
    key: TKey,
): TKey & NativeNetworkReducerKey => key as TKey & NativeNetworkReducerKey;
