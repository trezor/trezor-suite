import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { UpdateProgress } from '@trezor/suite-desktop-api';
import { bytesToHumanReadable } from '@trezor/utils';
import { H2, NewModal, ProgressBar, variables, Row, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

const DownloadProgress = styled.span`
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

const ReceivedData = styled.span`
    color: ${({ theme }) => theme.legacy.TYPE_GREEN};
`;

const TotalData = styled.span`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Text = styled(H2)`
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

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
        >
            <Column alignItems="start" gap={spacings.md}>
                <Row margin={{ top: spacings.md }} justifyContent="space-between" width="100%">
                    {progress?.verifying ? (
                        <Text>
                            <Translation id="TR_VERIFYING_SIGNATURE" />
                            {ellipsisArray.filter((_, k) => k < step)}
                        </Text>
                    ) : (
                        <>
                            <Text>
                                <Translation id="TR_DOWNLOADING" />
                            </Text>
                            <DownloadProgress>
                                <ReceivedData>
                                    {bytesToHumanReadable(progress?.transferred || 0)}
                                </ReceivedData>
                                /<TotalData>{bytesToHumanReadable(progress?.total || 0)}</TotalData>
                            </DownloadProgress>
                        </>
                    )}
                </Row>

                <ProgressBar value={progress?.percent || 0} />
            </Column>
        </NewModal>
    );
};
