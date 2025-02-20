import { NetworkSymbol } from '@suite-common/wallet-config';

import { useReceiveAccountsListData } from '../../../hooks/useReceiveAccountsListData';
import { useSelectedAccount } from '../../../hooks/useSelectedAccount';
import { TradingBottomSheetSectionList } from '../TradingBottomSheetSectionList';
import { ACCOUNT_LIST_ITEM_HEIGHT, AccountListItem } from './AccountListItem';
import { AccountSheetHeader } from './AccountSheetHeader';
import { AddressListEmptyComponent } from './AddressListEmptyComponent';
import { ReceiveAccount } from '../../../types';

export type AccountSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    onAccountSelect: (account: ReceiveAccount) => void;
    symbol: NetworkSymbol;
};

const keyExtractor = (item: ReceiveAccount) =>
    `${item.account.key}_${item.address?.address ?? 'address_undefined'}`;

export const AccountSheet = ({
    isVisible,
    onClose,
    onAccountSelect,
    symbol,
}: AccountSheetProps) => {
    const { selectedAccount, clearSelectedAccount, onItemSelect } = useSelectedAccount({
        onAccountSelect,
        onClose,
        isVisible,
    });

    const data = useReceiveAccountsListData(symbol, selectedAccount);

    return (
        <TradingBottomSheetSectionList<ReceiveAccount>
            isVisible={isVisible}
            onClose={onClose}
            handleComponent={() => (
                <AccountSheetHeader
                    onClose={onClose}
                    selectedAccountLabel={selectedAccount?.accountLabel}
                    clearSelectedAccount={clearSelectedAccount}
                />
            )}
            ListEmptyComponent={<AddressListEmptyComponent />}
            renderItem={item => (
                <AccountListItem
                    receiveAccount={item}
                    onPress={() => onItemSelect(item)}
                    symbol={symbol}
                />
            )}
            data={data}
            estimatedItemSize={ACCOUNT_LIST_ITEM_HEIGHT}
            keyExtractor={keyExtractor}
            noSingletonSectionHeader
        />
    );
};
