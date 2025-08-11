import { Account, TokenAddress } from '@suite-common/wallet-types';

import { GlobalSendReceiveModalBase } from './GlobalSendReceiveModalBase';
import { LocalAccountSearchProvider } from '../../../../../../hooks/suite/useAccountSearch';
import { AccountItemType } from '../../../../../../types/wallet';
import { Translation } from '../../../../Translation';

type GlobalSendModalProps = {
    onCancel: () => void;
    onSubmit: (account: Account, type: AccountItemType, tokenAddress?: TokenAddress) => void;
};

export const GlobalSendModal = ({ onCancel, onSubmit }: GlobalSendModalProps) => (
    <LocalAccountSearchProvider>
        <GlobalSendReceiveModalBase
            heading={<Translation id="SEND_TRANSACTION" />}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    </LocalAccountSearchProvider>
);
