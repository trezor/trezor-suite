import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { type Account } from '@suite-common/wallet-types';
import { BottomSheetModal, type BottomSheetModalRef, Box } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ChooseAccountItem } from './ChooseAccountItem';

type ChooseStakingAccountBottomSheetProps = {
    ref: BottomSheetModalRef;
    accounts: Account[];
    onAccountSelected: (account: Account) => void;
    onClose: () => void;
};

export const ChooseStakingAccountBottomSheet = ({
    ref,
    accounts,
    onAccountSelected,
    onClose,
}: ChooseStakingAccountBottomSheetProps) => {
    const renderItem = useCallback(
        ({ item, index }: { item: Account; index: number }) => (
            <ChooseAccountItem
                account={item}
                onPress={onAccountSelected}
                showDivider
                isFirst={index === 0}
                isLast={index === accounts.length - 1}
            />
        ),
        [onAccountSelected, accounts.length],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id="earn.earnScreen.chooseAccountSheet.title" />}
            isCloseDisplayed
            onClose={onClose}
        >
            <Box paddingTop="sp16">
                <FlashList
                    data={accounts}
                    keyExtractor={item => item.key}
                    renderItem={renderItem}
                />
            </Box>
        </BottomSheetModal>
    );
};
