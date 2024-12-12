import { useEffect, useState } from 'react';

import { UpdateProgress } from '@trezor/suite-desktop-api';
import { bytesToHumanReadable } from '@trezor/utils';
import { NewModal, ProgressBar, Paragraph, Column, Text, H3 } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
        <NewModal
            bottomContent={
                <NewModal.Button variant="tertiary" onClick={hideWindow}>
                    <Translation id="TR_BACKGROUND_DOWNLOAD" />
                </NewModal.Button>
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
                <Paragraph variant="tertiary" typographyStyle="body" align="right">
                    <Text variant="primary">
                        {bytesToHumanReadable(progress?.transferred || 0)}
                    </Text>
                    {' / '}
                    {bytesToHumanReadable(progress?.total || 0)}
                </Paragraph>
            </Column>
        </NewModal>
    );
};
