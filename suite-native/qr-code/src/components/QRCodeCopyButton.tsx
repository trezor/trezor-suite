import React from 'react';

import { Button } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';

type QRCodeCopyAndShareButtonProps = {
    data: string;
    onCopy?: () => void;
    onCopyMessage: string;
};

export const QRCodeCopyButton = ({
    data,
    onCopy,
    onCopyMessage,
}: QRCodeCopyAndShareButtonProps) => {
    const copyToClipboard = useCopyToClipboard();

    const handleCopy = async () => {
        await copyToClipboard(data, onCopyMessage);
        onCopy?.();
    };

    return (
        <Button size="large" onPress={handleCopy}>
            Copy
        </Button>
    );
};
