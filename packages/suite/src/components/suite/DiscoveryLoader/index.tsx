import React from 'react';
import styled from 'styled-components';
import { Image } from '@trezor/components';
import { Translation, Modal } from '@suite-components';

const Expand = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    margin: 40px 0px;
`;

const StyledModal = styled(Modal)`
    width: 360px;
`;

const DiscoveryLoader = () => (
    <StyledModal
        heading={<Translation id="TR_COIN_DISCOVERY_IN_PROGRESS" />}
        description={<Translation id="TR_TO_FIND_YOUR_ACCOUNTS_AND" />}
        data-test="@discovery/loader"
    >
        <Expand>
            <Image width={80} height={80} image="SPINNER" />
        </Expand>
    </StyledModal>
);

export default DiscoveryLoader;
