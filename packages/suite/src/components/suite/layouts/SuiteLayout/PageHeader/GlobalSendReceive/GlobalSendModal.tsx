import { Account } from '@suite-common/wallet-types';

import { GlobalSendReceiveModalBase } from './GlobalSendReceiveModalBase';
import { AccountItemType } from '../../../../../../types/wallet';
import { Translation } from '../../../../Translation';

type GlobalSendModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, type: AccountItemType, filledSearch: boolean) => void;
};

export const GlobalSendModal = ({ onCancel, onSubmit }: GlobalSendModalProps) => (
    <GlobalSendReceiveModalBase
        heading={<Translation id="SEND_TRANSACTION" />}
        onCancel={onCancel}
        onSubmit={onSubmit}
    />
);
