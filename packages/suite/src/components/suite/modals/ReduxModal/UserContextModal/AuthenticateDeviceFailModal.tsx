import styled from 'styled-components';

import { Modal } from 'src/components/suite';
import { SecurityCheckFail } from '../../../SecurityCheck/SecurityCheckFail';

const StyledModal = styled(Modal)`
    text-align: left;
`;

export const AuthenticateDeviceFailModal = () => (
    <StyledModal>
        <SecurityCheckFail />
    </StyledModal>
);
