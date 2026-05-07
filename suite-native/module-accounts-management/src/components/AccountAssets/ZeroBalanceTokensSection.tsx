import { useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import { type Account, type TokenAddress, type TokenInfoBranded } from '@suite-common/wallet-types';
import { AccountsListTokenItem } from '@suite-native/accounts';
import { AccordionContent, AnimatedBox, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type ZeroBalanceTokensSectionProps = {
    tokens: TokenInfoBranded[];
    account: Account;
};

const ANIMATION_DURATION = 200;

const headerStyle = prepareNativeStyle<{ isOpen: boolean }>((utils, { isOpen }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: utils.spacings.sp20,
    paddingVertical: utils.spacings.sp18,
    backgroundColor: utils.colors.surfaceFillRaised,
    borderTopWidth: utils.borders.widths.small,
    borderTopColor: utils.colors.borderNeutral,
    borderBottomLeftRadius: isOpen ? 0 : utils.borders.radii.r16,
    borderBottomRightRadius: isOpen ? 0 : utils.borders.radii.r16,
}));

export const ZeroBalanceTokensSection = ({ tokens, account }: ZeroBalanceTokensSectionProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountAssets>>();
    const { applyStyle } = useNativeStyles();

    const [isOpen, setIsOpen] = useState(false);
    const isExpanded = useSharedValue(false);

    const handleToggle = () => {
        const newValue = !isOpen;
        setIsOpen(newValue);
        isExpanded.value = newValue;
    };

    const animatedCaretStyle = useAnimatedStyle(() => ({
        transform: [
            {
                rotate: `${withTiming(isExpanded.value ? -180 : 0, { duration: ANIMATION_DURATION })}deg`,
            },
        ],
    }));

    const handleSelectToken = (tokenContract: TokenAddress) =>
        navigation.navigate(RootStackRoutes.AccountDetail, {
            accountKey: account.key,
            tokenContract,
            closeActionType: 'back',
        });

    return (
        <>
            <PressableOpacity onPress={handleToggle} style={applyStyle(headerStyle, { isOpen })}>
                <Text variant="body-sm">
                    <Translation id="moduleAccountManagement.accountAssetsScreen.zeroBalanceSection.title" />
                </Text>
                <AnimatedBox style={animatedCaretStyle}>
                    <Icon name="caretDown" size="small" />
                </AnimatedBox>
            </PressableOpacity>
            <AccordionContent isOpened={isExpanded}>
                {tokens.map((token, index) => (
                    <AccountsListTokenItem
                        key={token.contract}
                        token={token}
                        account={account}
                        hasBackground
                        isFirst={false}
                        isLast={index === tokens.length - 1}
                        showFiatValue={false}
                        onSelectAccount={() => handleSelectToken(token.contract)}
                    />
                ))}
            </AccordionContent>
        </>
    );
};
