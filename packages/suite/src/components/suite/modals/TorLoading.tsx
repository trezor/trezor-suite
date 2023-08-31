import styled from 'styled-components';

import { TorLoader, Modal } from 'src/components/suite';
import type { UserContextPayload } from 'src/actions/suite/modalActions';

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
