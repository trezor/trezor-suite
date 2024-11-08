import { Pressable } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { HStack, Radio, Text } from '@suite-native/atoms';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type WalletItemBaseVariant = 'standard' | 'passphrase';

type WalletItemBaseProps = {
    variant: WalletItemBaseVariant;
    onPress: () => void;
    isSelectable: boolean;
    isSelected: boolean;
    walletNumber?: number;
    fiatBalance?: string;
};

type WalletItemBaseStyleProps = { isSelected: boolean; isSelectable: boolean };

const walletItemBaseStyle = prepareNativeStyle<WalletItemBaseStyleProps>(
    (utils, { isSelected, isSelectable }) => ({
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
        gap: utils.spacings.sp12,
        borderRadius: utils.borders.radii.r12,
        borderColor: utils.colors.borderElevation1,
        flex: 1,
        extend: [
            {
                condition: isSelected,
                style: {
                    borderWidth: utils.borders.widths.large,
                    borderColor: utils.colors.borderSecondary,
                },
            },
            {
                condition: isSelectable,
                style: {
                    paddingHorizontal: utils.spacings.sp16,
                    backgroundColor: utils.colors.backgroundSurfaceElevation1,
                    borderWidth: utils.borders.widths.small,
                },
            },
        ],
    }),
);

const labelStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

export const WalletItemBase = ({
    variant,
    onPress,
    isSelected,
    isSelectable,
    walletNumber,
    fiatBalance,
}: WalletItemBaseProps) => {
    const { applyStyle } = useNativeStyles();
    const isStandard = variant === 'standard';

    const walletNameLabel = isStandard ? (
        <Translation id="deviceManager.wallet.standard" />
    ) : (
        <Translation id="deviceManager.wallet.defaultPassphrase" values={{ index: walletNumber }} />
    );

    return (
        <Pressable onPress={onPress}>
            <HStack style={applyStyle(walletItemBaseStyle, { isSelected, isSelectable })}>
                <HStack alignItems="center" flex={1}>
                    <Icon name={isStandard ? 'wallet' : 'password'} size="mediumLarge" />
                    <Text variant="callout" numberOfLines={1} style={applyStyle(labelStyle)}>
                        {walletNameLabel}
                    </Text>
                </HStack>
                <HStack alignItems="center" spacing="sp12">
                    {fiatBalance && (
                        <FiatAmountFormatter
                            value={fiatBalance}
                            variant="hint"
                            color="textSubdued"
                        />
                    )}
                    {isSelectable && <Radio value="" onPress={onPress} isChecked={isSelected} />}
                </HStack>
            </HStack>
        </Pressable>
    );
};
