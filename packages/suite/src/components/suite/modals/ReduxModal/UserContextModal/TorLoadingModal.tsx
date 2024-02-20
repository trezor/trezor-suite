import styled from 'styled-components';

import { UserContextPayload } from '@suite-common/suite-types';

import { TorLoader, Modal } from 'src/components/suite';

const SmallModal = styled(Modal)`
    width: 560px;
`;

type TorLoadingModalProps = Omit<Extract<UserContextPayload, { type: 'tor-loading' }>, 'type'> & {
    onCancel: () => void;
};

export const TorLoadingModal = ({ onCancel, decision }: TorLoadingModalProps) => {
    const callback = (result: boolean) => {
        onCancel();
        decision.resolve(result);
    };

    return <TorLoader ModalWrapper={SmallModal} callback={callback} />;
};
