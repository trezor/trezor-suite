import { useCallback, useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, Icon, Paragraph, Row, ShortcutBadge, Spinner } from '@trezor/components';
import { DropZone } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { decodeQRFromImage } from 'src/utils/suite/qrCode';

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.bmp,.webp';

type ImageQRReaderProps = {
    onResult: (result: string) => void;
};

export const ImageQRReader = ({ onResult }: ImageQRReaderProps) => {
    const [isDecoding, setIsDecoding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processImageFile = useCallback(
        async (file: File) => {
            if (!file.type.startsWith('image/')) {
                return;
            }

            setIsDecoding(true);
            setError(null);

            try {
                const result = await decodeQRFromImage(file);
                onResult(result);
            } catch {
                setError('TR_QR_NOT_FOUND');
            } finally {
                setIsDecoding(false);
            }
        },
        [onResult],
    );

    const handleSelect = useCallback(
        (file: File) => {
            processImageFile(file);
        },
        [processImageFile],
    );

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        processImageFile(file);
                    }

                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);

        return () => document.removeEventListener('paste', handlePaste);
    }, [processImageFile]);

    return (
        <Column gap={16}>
            {isDecoding ? (
                <Card height="100%">
                    <Column
                        height="100%"
                        justifyContent="center"
                        alignItems="center"
                        gap={spacings.md}
                    >
                        <Spinner size={40} />
                        <Paragraph>
                            <Translation id="TR_QR_DECODING" />
                        </Paragraph>
                    </Column>
                </Card>
            ) : (
                <>
                    <DropZone accept={IMAGE_ACCEPT} iconName="qrCode" onSelect={handleSelect} />
                    {error && (
                        <Card>
                            <Column alignItems="center" gap={spacings.xs}>
                                <Icon name="warning" size={24} intent="critical" />
                                <Paragraph intent="critical">
                                    <Translation id="TR_QR_NOT_FOUND" />
                                </Paragraph>
                            </Column>
                        </Card>
                    )}
                    <Card>
                        <Row alignItems="center" gap={4} justifyContent="space-between">
                            <Paragraph
                                intent="neutral"
                                priority="secondary"
                                typographyStyle="body-sm"
                            >
                                <Translation id="TR_QR_PASTE_HINT" />
                            </Paragraph>
                            <ShortcutBadge shortcut={['CTRL', 'KEY_V']} />
                        </Row>
                    </Card>
                </>
            )}
        </Column>
    );
};
