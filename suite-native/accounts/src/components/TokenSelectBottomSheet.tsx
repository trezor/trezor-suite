import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type WritableAtom, useAtom } from 'jotai';

import { type Account } from '@suite-common/wallet-types';

import { type NativeAccountsRootState, selectAccountListSections } from '../selectors';
import { type OnSelectAccount } from '../types';
import { AccountSelectBottomSheet } from './AccountSelectBottomSheet';

type TokenSelectBottomSheetProps = {
    bottomSheetAccountAtom: WritableAtom<Account | null, [Account | null], void>;
    onSelectAccount: OnSelectAccount;
    isStakingPressable?: boolean;
};

export const TokenSelectBottomSheet = ({
    bottomSheetAccountAtom,
    onSelectAccount,
    isStakingPressable = false,
}: TokenSelectBottomSheetProps) => {
    const [selectedAccount, setSelectedAccount] = useAtom(bottomSheetAccountAtom);

    const data = useSelector((state: NativeAccountsRootState) =>
        selectAccountListSections(state, selectedAccount?.key),
    );

    const isBottomSheetVisible = Boolean(selectedAccount && data.length);
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

    return (
        <AccountSelectBottomSheet
            onSelectAccount={handleSelectAccount}
            data={data}
            isVisible={isBottomSheetVisible}
            onClose={handleClose}
            isStakingPressable={isStakingPressable}
        />
    );
};
