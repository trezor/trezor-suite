import { useEffect, useState } from 'react';

import styled from 'styled-components';

import { UpdateProgress } from '@trezor/suite-desktop-api';
import { bytesToHumanReadable } from '@trezor/utils';
import { Button, H2, variables } from '@trezor/components';

import { Translation, Modal } from 'src/components/suite';

import { Row } from './styles';

const DownloadWrapper = styled(Row)`
    margin-top: 16px;
`;

const DownloadProgress = styled.span`
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const ReceivedData = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const TotalData = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Text = styled(H2)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledButton = styled(Button)`
    margin: 21px 0;
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
        <Modal
            headerComponent={
                <StyledButton
                    variant="secondary"
                    icon="CROSS"
                    alignIcon="right"
                    onClick={hideWindow}
                >
                    <Translation id="TR_BACKGROUND_DOWNLOAD" />
                </StyledButton>
            }
            currentProgressBarStep={progress?.percent || 0}
            totalProgressBarSteps={100}
            onCancel={hideWindow}
        >
            <DownloadWrapper>
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
            </DownloadWrapper>
        </Modal>
    );
};
