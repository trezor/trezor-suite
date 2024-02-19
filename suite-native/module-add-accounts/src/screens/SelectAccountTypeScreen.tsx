import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';
import { AccountType } from '@suite-common/wallet-config';
import {
    StackNavigationProps,
    AddCoinAccountStackParamList,
    AddCoinAccountStackRoutes,
    Screen,
    ScreenSubHeader,
    StackProps,
} from '@suite-native/navigation';
import { Button, VStack, Text, IconButton, Box, SelectableItem } from '@suite-native/atoms';
import { useTranslate, Translation, TxKeyPath } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';

import { useAddCoinAccount, accountTypeTranslationKeys } from '../hooks/useAddCoinAccount';

const GRADIENT_HEIGHT = 48;

// for extra space on the bottom due to android showing odd SafeAreaInsets.bottom
const EXTRA_BOTTOM_PADDING = 48;

const ACCOUNT_TYPES_URL = 'https://trezor.io/learn/a/multiple-accounts-in-trezor-suite';

const bulletsForKeyPath = (keyPath: TxKeyPath) => (
    <Translation
        id={keyPath}
        values={{
            li: chunks =>
                chunks.map(row => (
                    <Box flexDirection="row">
                        <Text variant="hint" color="textSubdued">
                            {'  '}•{'  '}
                        </Text>
                        <Text variant="hint" color="textSubdued">
                            {row}
                        </Text>
                    </Box>
                )),
        }}
    />
);

const itemsStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.extraSmall,
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
    paddingHorizontal: utils.spacings.medium,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
}));

const aboutStyle = prepareNativeStyle((utils, { bottomInset }: { bottomInset: number }) => ({
    paddingTop: utils.spacings.extraLarge,
    paddingBottom: EXTRA_BOTTOM_PADDING + GRADIENT_HEIGHT + bottomInset,
    width: '100%',
    paddingHorizontal: utils.spacings.small,
    gap: 12,
}));

export const SelectAccountTypeScreen = ({
    route,
}: StackProps<AddCoinAccountStackParamList, AddCoinAccountStackRoutes.SelectAccountType>) => {
    const { accountType: defaultType, network } = route.params;
    const { translate } = useTranslate();
    const openLink = useOpenLink();
    const insets = useSafeAreaInsets();
    const { applyStyle, utils } = useNativeStyles();
    const navigation =
        useNavigation<
            StackNavigationProps<
                AddCoinAccountStackParamList,
                AddCoinAccountStackRoutes.SelectAccountType
            >
        >();

    const { getAvailableAccountTypesForNetwork, addCoinAccount } = useAddCoinAccount();

    const [selectedAccountType, setSelectedAccountType] = useState<AccountType>(defaultType);

    const types: AccountType[] = getAvailableAccountTypesForNetwork({ network });
    const { titleKey: accountTypeKey } = accountTypeTranslationKeys[selectedAccountType];

    const handleClose = () => navigation.goBack();

    const handleMoreTap = () => openLink(ACCOUNT_TYPES_URL);

    const handleConfirmTap = () => {
        addCoinAccount({ network, accountType: selectedAccountType });
    };

    return (
        <>
            <Screen
                screenHeader={
                    <ScreenSubHeader
                        content={translate('moduleAddAccounts.selectAccountTypeScreen.title', {
                            symbol: _ => network.symbol.toUpperCase(),
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
                <VStack spacing="large" style={applyStyle(itemsStyle)}>
                    {types.map(item => {
                        const { titleKey, subtitleKey, descKey } = accountTypeTranslationKeys[item];

                        return (
                            <SelectableItem
                                key={`select-type-${item}`}
                                title={translate(titleKey)}
                                subtitle={translate(subtitleKey)}
                                description={bulletsForKeyPath(descKey)}
                                isSelected={selectedAccountType === item}
                                isDefault={defaultType === item}
                                data-test-id={`@add-account/select-type/${item}`}
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
                        {translate('moduleAddAccounts.selectAccountTypeScreen.buttons.more')}
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
                        {translate('moduleAddAccounts.selectAccountTypeScreen.buttons.confirm', {
                            type: _ => translate(accountTypeKey),
                        })}
                    </Button>
                </View>
            </View>
        </>
    );
};
