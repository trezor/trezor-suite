import { useState } from 'react';
import { View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { AccountType } from '@suite-common/wallet-config';
import {
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import {
    Button,
    VStack,
    Text,
    IconButton,
    SelectableItem,
    BulletListItem,
    Box,
} from '@suite-native/atoms';
import { useTranslate, Translation, TxKeyPath } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { useOfflineBannerAwareSafeAreaInsets } from '@suite-native/connection-status';

import { useAddCoinAccount, accountTypeTranslationKeys } from '../hooks/useAddCoinAccount';

const GRADIENT_HEIGHT = 48;

// for extra space on the bottom due to android showing odd SafeAreaInsets.bottom
const EXTRA_BOTTOM_PADDING = 48;

const ACCOUNT_TYPES_URL = 'https://trezor.io/learn/a/multiple-accounts-in-trezor-suite';

const bulletsForKeyPath = (keyPath: TxKeyPath) => (
    <Box paddingLeft="sp8">
        <Translation
            id={keyPath}
            values={{
                li: chunks =>
                    chunks.map(
                        row =>
                            row && (
                                <BulletListItem key={`${row}`} variant="hint" color="textSubdued">
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
    gap: 12,
}));

export const SelectAccountTypeScreen = ({
    route,
    navigation,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.SelectAccountType>) => {
    const { accountType: defaultType, networkSymbol, flowType } = route.params;
    const { translate } = useTranslate();
    const openLink = useOpenLink();
    const insets = useOfflineBannerAwareSafeAreaInsets();
    const { applyStyle, utils } = useNativeStyles();

    const { getAvailableAccountTypesForNetworkSymbol, addCoinAccount } = useAddCoinAccount();

    const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(defaultType);

    const types: AccountType[] = getAvailableAccountTypesForNetworkSymbol({ networkSymbol });
    const { titleKey: accountTypeKey } = accountTypeTranslationKeys[selectedAccountType];

    const handleClose = () => navigation.goBack();

    const handleMoreTap = () => openLink(ACCOUNT_TYPES_URL);

    const handleConfirmTap = () =>
        addCoinAccount({ networkSymbol, accountType: selectedAccountType, flowType });

    return (
        <>
            <Screen
                screenHeader={
                    <ScreenSubHeader
                        content={translate('moduleAddAccounts.selectAccountTypeScreen.title', {
                            symbol: _ => networkSymbol.toUpperCase(),
                        })}
                        leftIcon={
                            <IconButton
                                iconName="close"
                                onPress={handleClose}
                                colorScheme="tertiaryElevation0"
                                size="medium"
                            />
                        }
                    />
                }
            >
                <VStack spacing="sp24" style={applyStyle(itemsStyle)}>
                    {types.map(item => {
                        const { titleKey, subtitleKey, descKey } = accountTypeTranslationKeys[item];

                        return (
                            <SelectableItem
                                key={`select-type-${item}`}
                                title={<Translation id={titleKey} />}
                                subtitle={<Translation id={subtitleKey} />}
                                content={bulletsForKeyPath(descKey)}
                                isSelected={selectedAccountType === item}
                                isDefault={defaultType === item}
                                data-testID={`@add-account/select-type/${item}`}
                                onSelected={() => setSelectedAccountType(item)}
                            />
                        );
                    })}
                </VStack>
                <View style={applyStyle(aboutStyle, { bottomInset: insets.bottom })}>
                    <Text variant="hint" color="textSubdued" textAlign="center">
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
                                type: _ => translate(accountTypeKey),
                            }}
                        />
                    </Button>
                </View>
            </View>
        </>
    );
};
