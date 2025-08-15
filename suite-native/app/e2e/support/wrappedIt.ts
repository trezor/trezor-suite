import { TestMetadataInput } from '@trezor/e2e-utils';

import { writeMetadata } from './metadataIO';

type JestIt = typeof global.it;

interface ItWithMetadataFn {
    (name: string, fn: jest.ProvidesCallback, timeout?: number): void;
    (name: string, metadata: TestMetadataInput, fn: jest.ProvidesCallback, timeout?: number): void;
    skip: JestIt['skip'];
    only: JestIt['only'];
    concurrent: JestIt['concurrent'];
}

const wrappedIt = (
    name: string,
    metaOrFn: TestMetadataInput | jest.ProvidesCallback,
    fnOrTimeout?: jest.ProvidesCallback | number,
    maybeTimeout?: number,
) => {
    if (typeof metaOrFn === 'function') {
        const fn = metaOrFn;
        const timeout = fnOrTimeout as number | undefined;

        return global.it(name, fn, timeout);
    }

    const metadata = metaOrFn;
    const fn = fnOrTimeout as jest.ProvidesCallback;
    const timeout = maybeTimeout;

    writeMetadata(name, metadata);

    return global.it(name, fn, timeout);
};

(wrappedIt as ItWithMetadataFn).skip = globalThis.it.skip.bind(globalThis.it);
(wrappedIt as ItWithMetadataFn).only = globalThis.it.only.bind(globalThis.it);
(wrappedIt as ItWithMetadataFn).concurrent = globalThis.it.concurrent.bind(globalThis.it);

export const it: ItWithMetadataFn = wrappedIt as ItWithMetadataFn;
