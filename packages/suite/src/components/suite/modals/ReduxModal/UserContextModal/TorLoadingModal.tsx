import { TorLoader } from '@suite/tor-desktop';
import { type UserContextPayload } from '@suite-common/suite-types';

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
