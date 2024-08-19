import { WritableAtom, useAtom } from 'jotai';

import { Account } from '@suite-common/wallet-types';
import { AccountListItemInteractive, OnSelectAccount } from '@suite-native/accounts';
import { BottomSheet } from '@suite-native/atoms';

type TokenSelectBottomSheetProps = {
    bottomSheetAccountAtom: WritableAtom<Account | null, Account | null>;
    onSelectAccount: OnSelectAccount;
};

export const TokenSelectBottomSheet = ({
    bottomSheetAccountAtom,
    onSelectAccount,
}: TokenSelectBottomSheetProps) => {
    const [selectedAccount, setSelectedAccount] = useAtom(bottomSheetAccountAtom);

    const handleSelectAccount: OnSelectAccount = params => {
        setSelectedAccount(null);
        onSelectAccount(params);
    };

    if (!selectedAccount) {
        return null;
    }

    return (
        <BottomSheet
            title="Select Account"
            isVisible
            onClose={() => {
                setSelectedAccount(null);
            }}
        >
            <AccountListItemInteractive
                key={selectedAccount.key}
                account={selectedAccount}
                onSelectAccount={handleSelectAccount}
            />
        </BottomSheet>
    );
};
