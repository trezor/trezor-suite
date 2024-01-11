import styled from 'styled-components';
import { Spinner } from '@trezor/components';
import { Translation, Modal } from 'src/components/suite';

const Expand = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    margin: 40px 0;
`;

const StyledModal = styled(Modal)`
    width: 360px;
`;

export const DiscoveryLoader = () => (
    <StyledModal
        heading={<Translation id="TR_COIN_DISCOVERY_IN_PROGRESS" />}
        description={<Translation id="TR_TO_FIND_YOUR_ACCOUNTS_AND" />}
        data-test="@discovery/loader"
    >
        <Expand>
            <Spinner size={80} isGrey={false} />
        </Expand>
    </StyledModal>
);
