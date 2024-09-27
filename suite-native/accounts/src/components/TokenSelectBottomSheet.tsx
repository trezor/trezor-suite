import { useSelector } from 'react-redux';
import { useCallback } from 'react';

import { WritableAtom, useAtom } from 'jotai';

import { Account } from '@suite-common/wallet-types';

import { OnSelectAccount } from '../types';
import { NativeAccountsRootState, selectAccountListSections } from '../selectors';
import { AccountSelectBottomSheet } from './AccountSelectBottomSheet';

type TokenSelectBottomSheetProps = {
    bottomSheetAccountAtom: WritableAtom<Account | null, Account | null>;
    onSelectAccount: OnSelectAccount;
    isStakingPressable?: boolean;
};

export const TokenSelectBottomSheet = ({
    bottomSheetAccountAtom,
    onSelectAccount,
    isStakingPressable = false,
}: TokenSelectBottomSheetProps) => {
    const [selectedAccount, setSelectedAccount] = useAtom(bottomSheetAccountAtom);

    const handleSelectAccount: OnSelectAccount = useCallback(
        params => {
            setSelectedAccount(null);
            onSelectAccount(params);
        },
        [onSelectAccount, setSelectedAccount],
    );

    const handleClose = useCallback(() => {
        setSelectedAccount(null);
    }, [setSelectedAccount]);

    const data = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSections(state, selectedAccount?.key),
    );
    if (!selectedAccount) {
        return null;
    }

    return (
        <AccountSelectBottomSheet
            onSelectAccount={handleSelectAccount}
            data={data}
            onClose={handleClose}
            isStakingPressable={isStakingPressable}
        />
    );
};
