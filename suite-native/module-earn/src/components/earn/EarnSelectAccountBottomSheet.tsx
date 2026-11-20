import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { TokenMetadataProvider, useTokenMetadataSources } from '@suite-common/token';
import { type Account } from '@suite-common/wallet-types';
import { BottomSheetModal, type BottomSheetModalRef, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { type ChooseAccountTokenBalance, type EarnType } from '../../types';
import { chooseAccountTokenBalanceToTokenMetadataSources } from '../../utils/earn/chooseAccountTokenBalanceToTokenMetadataSources';
import { getChooseAccountBalanceData } from '../../utils/staking/chooseAccountBalanceUtils';
import { ChooseAccountItem } from '../staking/ChooseAccountItem';

const getTitleTranslationId = (type: EarnType, isViewOnly: boolean): TxKeyPath => {
    if (type === 'yield') {
        return 'earn.earnScreen.chooseAccountSheet.yieldTitle';
    }

    return isViewOnly
        ? 'earn.earnScreen.chooseAccountSheet.title'
        : 'earn.earnScreen.chooseAccountSheet.stakingTitle';
};

type EarnSelectAccountBottomSheetProps = {
    ref: BottomSheetModalRef;
    type: EarnType;
    isViewOnly?: boolean;
    accounts: Account[];
    onAccountPress: (account: Account) => void;
    tokenBalance?: ChooseAccountTokenBalance;
    onClose: () => void;
    onDismiss?: () => void;
};

export const EarnSelectAccountBottomSheet = ({
    ref,
    type,
    isViewOnly = false,
    accounts,
    onAccountPress,
    tokenBalance,
    onClose,
    onDismiss,
}: EarnSelectAccountBottomSheetProps) => {
    // The sheet renders in a portal outside the screen's metadata provider, and the selected
    // token may be absent from every account.
    const parentMetadataSources = useTokenMetadataSources();
    const metadataSources = [
        ...chooseAccountTokenBalanceToTokenMetadataSources(accounts, tokenBalance),
        ...parentMetadataSources,
    ];
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
            title={<Translation id={getTitleTranslationId(type, isViewOnly)} />}
            isCloseDisplayed
            onClose={onClose}
            onDismiss={onDismiss}
        >
            <TokenMetadataProvider sources={metadataSources}>
                <VStack marginTop="sp16">
                    <FlashList
                        data={accounts}
                        keyExtractor={account => `${type}:${account.key}`}
                        renderItem={renderItem}
                    />
                </VStack>
            </TokenMetadataProvider>
        </BottomSheetModal>
    );
};
