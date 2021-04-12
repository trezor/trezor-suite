import React from 'react';
import styled from 'styled-components';
import { Translation, Image, Modal } from '@suite-components';

const Expand = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    margin: 40px 0px;
`;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends React.HTMLAttributes<HTMLDivElement> {}

const DiscoveryLoader = (props: Props) => (
    <Modal
        size="tiny"
        heading={<Translation id="TR_COIN_DISCOVERY_IN_PROGRESS" />}
        description={<Translation id="TR_TO_FIND_YOUR_ACCOUNTS_AND" />}
        {...props}
        data-test="@discovery/loader"
    >
        <Expand>
            <Image width={80} height={80} image="SPINNER" />
        </Expand>
    </Modal>
);

export default DiscoveryLoader;
