import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type TokensRootState,
    selectAccountByKey,
    selectAccountManuallyHiddenTokens,
    selectAccountUnrecognizedTokens,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import { Card, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { type OnSelectAsset } from './types';

type HiddenTokensTabProps = {
    accountKey: AccountKey;
    onSelect: OnSelectAsset;
};

export const HiddenTokensTab = ({ accountKey, onSelect }: HiddenTokensTabProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const manuallyHiddenTokens = useSelector((state: TokensRootState) =>
        selectAccountManuallyHiddenTokens(state, accountKey),
    );
    const unrecognizedTokens = useSelector((state: TokensRootState) =>
        selectAccountUnrecognizedTokens(state, accountKey),
    );

    if (manuallyHiddenTokens.length === 0 && unrecognizedTokens.length === 0) {
        return (
            <Card>
                <PictogramTitleHeader
                    variant="info"
                    icon="coins"
                    title={
                        <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.emptyTitle" />
                    }
                />
            </Card>
        );
    }

    if (!account) return null;

    return (
        <VStack spacing="sp16">
            {manuallyHiddenTokens.length > 0 && (
                <>
                    <Text variant="headline-sm">
                        <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenByUserSection.title" />
                    </Text>
                    <Card noPadding>
                        {manuallyHiddenTokens.map((token, index) => (
                            <AccountsListTokenItem
                                key={token.contract}
                                token={token}
                                account={account}
                                isLast={index === manuallyHiddenTokens.length - 1}
                                showFiatValue={false}
                                onSelectAccount={() =>
                                    onSelect({
                                        tokenContract: token.contract,
                                        tokenSymbol: token.symbol,
                                    })
                                }
                            />
                        ))}
                    </Card>
                </>
            )}
            {unrecognizedTokens.length > 0 && (
                <>
                    <Text variant="headline-sm">
                        <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.title" />
                    </Text>
                    <Card
                        noPadding
                        alertProps={{
                            variant: 'warning',
                            title: (
                                <Translation id="moduleAccountManagement.accountAssetsScreen.hiddenTokensSection.warning" />
                            ),
                        }}
                    >
                        {unrecognizedTokens.map((token, index) => (
                            <AccountsListTokenItem
                                key={token.contract}
                                token={token}
                                account={account}
                                isLast={index === unrecognizedTokens.length - 1}
                                showFiatValue={false}
                                onSelectAccount={() =>
                                    onSelect({
                                        tokenContract: token.contract,
                                        tokenSymbol: token.symbol,
                                    })
                                }
                            />
                        ))}
                    </Card>
                </>
            )}
        </VStack>
    );
};
