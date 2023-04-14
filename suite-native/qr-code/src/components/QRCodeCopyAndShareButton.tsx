import React from 'react';

import { Button } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/helpers';

type QRCodeCopyAndShareButtonProps = {
    data: string;
    onCopyMessage: string;
    onCopy: () => void;
};

export const QRCodeCopyAndShareButton = ({
    data,
    onCopyMessage,
    onCopy,
}: QRCodeCopyAndShareButtonProps) => {
    const copyToClipboard = useCopyToClipboard();

    const handleCopyAndClose = async () => {
        await copyToClipboard(data, onCopyMessage);
        onCopy();
    };

    return (
        <Button size="large" onPress={handleCopyAndClose}>
            Copy & Close
        </Button>
    );
};
