import { useEffect, useState } from 'react';

import { Button } from '@trezor/components';

const COPIED_FEEDBACK_MS = 2000;

type CopyButtonProps = {
    textToCopy: string;
    copyLabel: string;
};

export const CopyButton = ({ textToCopy, copyLabel }: CopyButtonProps) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const id = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);

        return () => clearTimeout(id);
    }, [copied]);

    const handleClick = async () => {
        if (!textToCopy) return;
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
    };

    return (
        <Button
            size="small"
            intent="neutral"
            priority="secondary"
            iconLeft={copied ? 'check' : 'copy'}
            onClick={handleClick}
        >
            {copied ? 'Copied!' : copyLabel}
        </Button>
    );
};
