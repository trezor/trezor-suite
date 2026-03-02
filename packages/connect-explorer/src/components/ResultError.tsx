import { useMDXComponents } from '@trezor/connect-explorer-theme';

import { HighlightedCode } from './HighlightedCode';

const errorCode = `{
    success: false,
    error: {
        message: string // error message
    }
}`;

export const ResultError = () => {
    const components = useMDXComponents() as any;
    const P = components.p ?? 'p';

    return (
        <>
            <P>Error</P>
            <HighlightedCode code={errorCode} language="javascript" />
        </>
    );
};
