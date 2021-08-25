import React from 'react';
import styled from 'styled-components';
import { Translation, Modal } from '@suite-components';
import UdevDownload from '@suite-components/UdevDownload';
import { InjectedModalApplicationProps } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 780px;
    margin: 24px 0;
`;

const UdevRules = (props: InjectedModalApplicationProps) => (
    <Modal
        data-test="@modal/udev"
        cancelable
        onCancel={props.onCancel}
        heading={<Translation id="TR_UDEV_DOWNLOAD_TITLE" />}
        description={<Translation id="TR_UDEV_DOWNLOAD_DESC" />}
    >
        <Wrapper>
            <UdevDownload />
        </Wrapper>
    </Modal>
);

export default UdevRules;
