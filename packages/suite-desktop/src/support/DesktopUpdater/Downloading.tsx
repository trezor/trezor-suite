import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { H2, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { Row } from './styles';

import { bytesToHumanReadable } from '@trezor/utils';
import { UpdateProgress } from '@suite-types/desktop';

const ModalHeadingWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

const DownloadWrapper = styled(Row)`
    margin-top: 16px;
`;

const DownloadProgress = styled.span`
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const ReceivedData = styled.span`
    color: ${props => props.theme.TYPE_GREEN};
`;

const TotalData = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const Text = styled(H2)`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    hideWindow: () => void;
    progress?: Partial<UpdateProgress>;
}

const ellipsisArray = new Array(3).fill('.');

const Downloading = ({ hideWindow, progress }: Props) => {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setStep(step > 2 ? 0 : step + 1), 300);
        return () => clearTimeout(timer);
    }, [step]);

    return (
        <Modal
            heading={
                <ModalHeadingWrapper>
                    <Translation id="TR_UPDATE_MODAL_DOWNLOADING_UPDATE" />
                </ModalHeadingWrapper>
            }
            currentProgressBarStep={progress?.percent || 0}
            totalProgressBarSteps={100}
            cancelable
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

export default Downloading;
