import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { useMutation } from '@suite-common/react-query';
import { Card, Column, Icon, Paragraph, Row, ShortcutBadge, Spinner } from '@trezor/components';
import { QrCodeIcon, WarningIcon } from '@trezor/icons';
import { DropZone } from '@trezor/product-components';

import { decodeQRFromImage } from 'src/utils/suite/qrCode';

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.bmp,.webp';

type ImageQRReaderProps = {
    onResult: (result: string) => void;
};

export const ImageQRReader = ({ onResult }: ImageQRReaderProps) => {
    const {
        mutate: processImageFile,
        isPending: isDecoding,
        error,
    } = useMutation({
        mutationFn: decodeQRFromImage,
        onError: (_: Error) => 'TR_QR_NOT_FOUND',
        onSuccess: onResult,
    });

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const imageItem = Array.from(event.clipboardData?.items ?? []).find(item =>
                item.type.startsWith('image/'),
            );
            const imageFile = imageItem?.getAsFile();

            if (!imageFile) return;

            if (!IMAGE_ACCEPT.split(',').some(ext => imageFile.name.toLowerCase().endsWith(ext))) {
                return;
            }

            processImageFile(imageFile);
        };

        document.addEventListener('paste', handlePaste);

        return () => document.removeEventListener('paste', handlePaste);
    }, [processImageFile]);

    return (
        <Column gap={16}>
            {isDecoding ? (
                <Card height="100%">
                    <Column height="100%" justifyContent="center" alignItems="center" gap={16}>
                        <Spinner size={40} />
                        <Paragraph>
                            <Translation id="TR_QR_DECODING" />
                        </Paragraph>
                    </Column>
                </Card>
            ) : (
                <>
                    <DropZone
                        accept={IMAGE_ACCEPT}
                        icon={QrCodeIcon}
                        emptyLabel={<Translation id="TR_DROPZONE" />}
                        emptyError={<Translation id="TR_DROPZONE_ERROR_EMPTY" />}
                        fileTypeError={<Translation id="TR_DROPZONE_ERROR_FILETYPE" />}
                        onSelect={file => {
                            if (file.type.startsWith('image/')) {
                                processImageFile(file);
                            }
                        }}
                    />
                    {error && (
                        <Card>
                            <Column alignItems="center" gap={8}>
                                <Icon as={WarningIcon} size={24} intent="critical" />
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
