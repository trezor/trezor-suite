import { Pre } from 'nextra/components';

const errorCode = `{
    success: false,
    error: {
        message: string // error message
    }
}`;

export const ResultError = () => (
    <>
        <p>Error</p>
        <Pre hasCopyCode className="nx-bg-neutral-500/5">
            <code className="language-javascript">{errorCode}</code>
        </Pre>
    </>
);
