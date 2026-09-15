import { useEffect, useState } from 'react';

import { type ParsedIframeProps, type UnknownIframeProps, iframeProps } from '../schemas';

export function useParseIframeProps({ src, sandbox, referrerPolicy }: UnknownIframeProps) {
    const [parsedProps, setParsedProps] = useState<ParsedIframeProps | null>(null);

    useEffect(() => {
        const parsedResult = iframeProps.safeParse({
            src,
            sandbox,
            referrerPolicy,
        });

        if (parsedResult.success) {
            setParsedProps(parsedResult.data);
        } else {
            console.error(parsedResult.error);
            setParsedProps(null);
        }
    }, [src, sandbox, referrerPolicy]);

    return parsedProps;
}
