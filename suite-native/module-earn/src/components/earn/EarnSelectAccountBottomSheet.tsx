import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { type Account } from '@suite-common/wallet-types';
import { BottomSheetModal, type BottomSheetModalRef, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { type ChooseAccountTokenBalance, type EarnType } from '../../types';
import { getChooseAccountBalanceData } from '../../utils/staking/chooseAccountBalanceUtils';
import { ChooseAccountItem } from '../staking/ChooseAccountItem';

const titleTranslationIds = {
    staking: 'earn.earnScreen.chooseAccountSheet.stakingTitle',
    yield: 'earn.earnScreen.chooseAccountSheet.yieldTitle',
} satisfies Record<EarnType, TxKeyPath>;

type EarnSelectAccountBottomSheetProps = {
    ref: BottomSheetModalRef;
    type: EarnType;
    accounts: Account[];
    onAccountPress: (account: Account) => void;
    tokenBalance?: ChooseAccountTokenBalance;
    onClose: () => void;
    onDismiss?: () => void;
};

export const EarnSelectAccountBottomSheet = ({
    ref,
    type,
    accounts,
    onAccountPress,
    tokenBalance,
    onClose,
    onDismiss,
}: EarnSelectAccountBottomSheetProps) => {
    const renderItem = useCallback(
        ({ item }: { item: Account }) => {
            const balanceData = getChooseAccountBalanceData(item, tokenBalance);

            return (
                <ChooseAccountItem
                    account={item}
                    balanceData={balanceData}
                    onPress={onAccountPress}
                />
            );
        },
        [onAccountPress, tokenBalance],
    );

    return (
        <BottomSheetModal
            ref={ref}
            title={<Translation id={titleTranslationIds[type]} />}
            isCloseDisplayed
            onClose={onClose}
            onDismiss={onDismiss}
        >
            <VStack marginTop="sp16">
                <FlashList
                    data={accounts}
                    keyExtractor={account => `${type}:${account.key}`}
                    renderItem={renderItem}
                />
            </VStack>
        </BottomSheetModal>
    );
};
