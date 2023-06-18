import React from 'react';
import styled from 'styled-components';
import { Translation, Modal } from 'src/components/suite';
import UdevDownload from 'src/components/suite/UdevDownload';
import type { ForegroundAppProps } from 'src/types/suite';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 780px;
    margin: 24px 0;
`;

export const UdevRules = ({ onCancel }: ForegroundAppProps) => (
    <Modal
        data-test="@modal/udev"
        isCancelable
        onCancel={onCancel}
        heading={<Translation id="TR_UDEV_DOWNLOAD_TITLE" />}
        description={<Translation id="TR_UDEV_DOWNLOAD_DESC" />}
    >
        <Wrapper>
            <UdevDownload />
        </Wrapper>
    </Modal>
);
