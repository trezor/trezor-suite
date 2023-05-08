import React from 'react';
import styled from 'styled-components';

import { TorLoader, Modal } from '@suite-components';
import type { UserContextPayload } from '@suite-actions/modalActions';

const SmallModal = styled(Modal)`
    width: 560px;
`;

type RequestEnableTorProps = Omit<Extract<UserContextPayload, { type: 'tor-loading' }>, 'type'> & {
    onCancel: () => void;
};

export const TorLoading = ({ onCancel, decision }: RequestEnableTorProps) => {
    const callback = (result: boolean) => {
        onCancel();
        decision.resolve(result);
    };
    return <TorLoader ModalWrapper={SmallModal} callback={callback} />;
};
