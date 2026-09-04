import { useMemo } from 'react';

import { useFreshRef } from '@trezor/react-utils';

import { type UnknownIframeProps, iframeProps } from '../schemas';

export function useParseIframeProps({ src, sandbox, referrerPolicy }: UnknownIframeProps) {
    const sandboxRef = useFreshRef(sandbox);

    return useMemo(() => {
        const parsedResult = iframeProps.safeParse({
            src,
            sandbox: sandboxRef.current,
            referrerPolicy,
        });

        if (parsedResult.success) {
            return parsedResult.data;
        }

        console.error(parsedResult.error);

        return null;
    }, [src, sandboxRef, referrerPolicy]);
}
