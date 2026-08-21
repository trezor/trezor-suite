import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { type Account } from '@suite-common/wallet-types';
import { BottomSheetModal, type BottomSheetModalRef, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ChooseAccountItem } from './ChooseAccountItem';
import { type ChooseAccountTokenBalance } from '../types';
import { getChooseAccountBalanceData } from '../utils/chooseAccountBalanceUtils';

type ChooseStakingAccountBottomSheetProps = {
    ref: BottomSheetModalRef;
    accounts: Account[];
    onAccountSelected: (account: Account) => void;
    onClose: () => void;
    onDismiss?: () => void;
    tokenBalance?: ChooseAccountTokenBalance;
};

export const ChooseStakingAccountBottomSheet = ({
    ref,
    accounts,
    onAccountSelected,
    onClose,
    onDismiss,
    tokenBalance,
}: ChooseStakingAccountBottomSheetProps) => {
    const renderItem = useCallback(
        ({ item }: { item: Account }) => {
            const balanceData = getChooseAccountBalanceData(item, tokenBalance);

            return (
                <ChooseAccountItem
                    account={item}
                    balanceData={balanceData}
                    onPress={onAccountSelected}
                />
            );
        },
        [onAccountSelected, tokenBalance],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.chooseAccountSheet.title" />}
            isCloseDisplayed
            onClose={onClose}
            onDismiss={onDismiss}
        >
            <VStack marginTop="sp16">
                <FlashList
                    data={accounts}
                    keyExtractor={item => item.key}
                    renderItem={renderItem}
                />
            </VStack>
        </BottomSheetModal>
    );
};
