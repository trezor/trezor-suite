import { type UserContextPayload } from '@suite-common/suite-types';

import { TorLoader } from 'src/components/suite/TorLoader/TorLoader';

type TorLoadingModalProps = Omit<Extract<UserContextPayload, { type: 'tor-loading' }>, 'type'> & {
    onCancel: () => void;
};

export const TorLoadingModal = ({ onCancel, decision }: TorLoadingModalProps) => {
    const callback = (result: boolean) => {
        onCancel();
        decision.resolve(result);
    };

    return <TorLoader callback={callback} />;
};
