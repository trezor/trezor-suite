import { useState } from 'react';
import { View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { type AccountType } from '@suite-common/wallet-config';
import {
    Box,
    BulletListItem,
    Button,
    SelectableItem,
    Text,
    VStack,
    useBannerAwareSafeAreaInsets,
} from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    type AddCoinAccountStackParamList,
    type AddCoinAccountStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { TREZOR_SUPPORT_MULTIPLE_ACCOUNTS } from '@trezor/urls';

import {
    type AddCoinEnabledAccountType,
    accountTypeTranslationKeys,
    useAddCoinAccount,
} from '../hooks/useAddCoinAccount';

const GRADIENT_HEIGHT = 48;

// for extra space on the bottom due to android showing odd SafeAreaInsets.bottom
const EXTRA_BOTTOM_PADDING = 48;

const bulletsForKeyPath = (keyPath: TxKeyPath) => (
    <Box paddingLeft="sp8">
        <Translation
            id={keyPath}
            values={{
                li: chunks =>
                    chunks.map(
                        row =>
                            row && (
                                <BulletListItem
                                    key={`${row}`}
                                    variant="body-sm"
                                    color="textSubdued"
                                >
                                    {row}
                                </BulletListItem>
                            ),
                    ),
            }}
        />
    </Box>
);

const itemsStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp4,
}));

const bottomWrapperStyle = prepareNativeStyle((_, { bottomInset }: { bottomInset: number }) => ({
    position: 'absolute',
    paddingBottom: bottomInset,
    left: 0,
    right: 0,
    bottom: 0,
}));

const gradientStyle = prepareNativeStyle(_ => ({
    height: GRADIENT_HEIGHT,
}));

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

const aboutStyle = prepareNativeStyle((utils, { bottomInset }: { bottomInset: number }) => ({
    paddingTop: utils.spacings.sp32,
    paddingBottom: EXTRA_BOTTOM_PADDING + GRADIENT_HEIGHT + bottomInset,
    width: '100%',
    paddingHorizontal: utils.spacings.sp8,
    gap: utils.spacings.sp12,
}));

const getAccountTypeTranslations = (type: AccountType) => {
    if (!Object.keys(accountTypeTranslationKeys).includes(type)) {
        return undefined;
    }

    return accountTypeTranslationKeys[type as AddCoinEnabledAccountType];
};

export const SelectAccountTypeScreen = ({
    route,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.SelectAccountType>) => {
    const { accountType: defaultType, networkSymbol, flowType } = route.params;
    const { translate } = useTranslate();
    const openLink = useOpenLink();
    const insets = useBannerAwareSafeAreaInsets();
    const { applyStyle, utils } = useNativeStyles();

    const { getAvailableAccountTypesForNetworkSymbol, addCoinAccount } = useAddCoinAccount();

    const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(defaultType);

    const types: AccountType[] = getAvailableAccountTypesForNetworkSymbol({
        symbol: networkSymbol,
    });

    const accountTypeKey = getAccountTypeTranslations(selectedAccountType)?.titleKey;

    const handleMoreTap = () => openLink(TREZOR_SUPPORT_MULTIPLE_ACCOUNTS);

    const handleConfirmTap = () =>
        addCoinAccount({ symbol: networkSymbol, accountType: selectedAccountType, flowType });

    return (
        <>
            <Screen
                header={
                    <ScreenHeader
                        title={translate('moduleAddAccounts.selectAccountTypeScreen.title', {
                            symbol: _ => networkSymbol.toUpperCase(),
                        })}
                        closeActionType="close"
                    />
                }
            >
                <VStack spacing="sp24" style={applyStyle(itemsStyle)}>
                    {types.map(item => {
                        const intlData = getAccountTypeTranslations(item);
                        if (!intlData) {
                            return null;
                        }
                        const { titleKey, subtitleKey, descKey } = intlData;

                        return (
                            <SelectableItem
                                key={`select-type-${item}`}
                                title={<Translation id={titleKey} />}
                                subtitle={<Translation id={subtitleKey} />}
                                content={bulletsForKeyPath(descKey)}
                                isSelected={selectedAccountType === item}
                                isDefault={defaultType === item}
                                testID={`@add-account/select-type/${item}`}
                                onSelected={() => setSelectedAccountType(item)}
                            />
                        );
                    })}
                </VStack>
                <View style={applyStyle(aboutStyle, { bottomInset: insets.bottom })}>
                    <Text variant="body-sm" color="textSubdued" textAlign="center">
                        <Translation id="moduleAddAccounts.selectAccountTypeScreen.aboutTypesLabel" />
                    </Text>
                    <Button size="medium" colorScheme="tertiaryElevation0" onPress={handleMoreTap}>
                        <Translation id="moduleAddAccounts.selectAccountTypeScreen.buttons.more" />
                    </Button>
                </View>
            </Screen>
            <View style={applyStyle(bottomWrapperStyle, { bottomInset: insets.bottom })}>
                <LinearGradient
                    style={applyStyle(gradientStyle)}
                    colors={[
                        utils.transparentize(1, utils.colors.backgroundSurfaceElevation0),
                        utils.colors.backgroundSurfaceElevation0,
                    ]}
                />
                <View style={applyStyle(buttonWrapperStyle)}>
                    <Button size="medium" onPress={handleConfirmTap}>
                        <Translation
                            id="moduleAddAccounts.selectAccountTypeScreen.buttons.confirm"
                            values={{
                                type: _ => (accountTypeKey ? translate(accountTypeKey) : undefined),
                            }}
                        />
                    </Button>
                </View>
            </View>
        </>
    );
};
