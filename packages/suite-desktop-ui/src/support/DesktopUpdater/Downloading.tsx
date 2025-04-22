import { useEffect, useState } from 'react';

import { Column, H3, Modal, Paragraph, ProgressBar, Text } from '@trezor/components';
import { UpdateProgress } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';
import { bytesToHumanReadable } from '@trezor/utils';

import { Translation } from 'src/components/suite';

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
                <Modal.Button variant="tertiary" onClick={hideWindow}>
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
                <Paragraph variant="tertiary" typographyStyle="body" align="end">
                    <Text variant="primary">
                        {bytesToHumanReadable(progress?.transferred || 0)}
                    </Text>
                    {' / '}
                    {bytesToHumanReadable(progress?.total || 0)}
                </Paragraph>
            </Column>
        </Modal>
    );
};
