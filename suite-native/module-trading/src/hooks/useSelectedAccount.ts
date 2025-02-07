import { useCallback, useEffect, useState } from 'react';

import { Account } from '@suite-common/wallet-types/';

import { ReceiveAccount } from '../types';

type AccountSheetState = {
    isVisible: boolean;
    onClose: () => void;
    onAccountSelect: (account: ReceiveAccount) => void;
};

export const useSelectedAccount = ({ onAccountSelect, onClose, isVisible }: AccountSheetState) => {
    const [selectedAccount, setSelectedAccount] = useState<undefined | Account>();

    const onItemSelect = useCallback(
        (selectedReceiveAccount: ReceiveAccount) => {
            const { account, address } = selectedReceiveAccount;

            if (account.addresses && !address) {
                setSelectedAccount(account);

                return;
            }

            onAccountSelect(selectedReceiveAccount);
            onClose();
        },
        [onAccountSelect, onClose],
    );

    const clearSelectedAccount = useCallback(() => setSelectedAccount(undefined), []);

    useEffect(() => {
        if (!isVisible) {
            clearSelectedAccount();
        }
    }, [isVisible, clearSelectedAccount]);

    return { selectedAccount, onItemSelect, clearSelectedAccount };
};
