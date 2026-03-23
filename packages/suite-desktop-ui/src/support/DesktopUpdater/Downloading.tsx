import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { Column, H3, Modal, Paragraph, ProgressBar, Text } from '@trezor/components';
import { type UpdateProgress } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';
import { bytesToHumanReadable } from '@trezor/utils';

interface DownloadingProps {
    hideWindow: () => void;
    progress?: UpdateProgress;
}

const ellipsisArray = new Array(3).fill('.');

export const Downloading = ({ hideWindow, progress }: DownloadingProps) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setStep(step > 2 ? 0 : step + 1), 300);

        return () => clearTimeout(timer);
    }, [step]);

    return (
        <Modal
            bottomContent={
                <Modal.Button intent="neutral" priority="secondary" onClick={hideWindow}>
                    <Translation id="TR_BACKGROUND_DOWNLOAD" />
                </Modal.Button>
            }
            iconName="download"
        >
            <H3>
                {progress?.verifying ? (
                    <>
                        <Translation id="TR_VERIFYING_SIGNATURE" />
                        {ellipsisArray.filter((_, k) => k < step)}
                    </>
                ) : (
                    <Translation id="TR_DOWNLOADING" />
                )}
            </H3>
            <Column gap={spacings.xxs} margin={{ top: spacings.xs }}>
                <ProgressBar value={progress?.percent || 0} />
                <Paragraph
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-md"
                    align="end"
                >
                    <Text intent="brand">{bytesToHumanReadable(progress?.transferred || 0)}</Text>
                    {' / '}
                    {bytesToHumanReadable(progress?.total || 0)}
                </Paragraph>
            </Column>
        </Modal>
    );
};
