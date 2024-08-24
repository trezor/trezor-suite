import { WritableAtom, useAtom } from 'jotai';

import { Account } from '@suite-common/wallet-types';
import { BottomSheet } from '@suite-native/atoms';

import { OnSelectAccount } from '../types';
import { AccountListItemInteractive } from './AccountListItemInteractive';

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
