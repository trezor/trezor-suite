import styled from 'styled-components';

import { TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL } from '@trezor/urls';

import { Modal } from 'src/components/suite';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';

const StyledModal = styled(Modal)`
    text-align: left;
`;

export const AuthenticateDeviceFailModal = () => (
    <StyledModal>
        <SecurityCheckFail supportUrl={TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL} />
    </StyledModal>
);
