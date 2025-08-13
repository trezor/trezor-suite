import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { WithLabelingState, selectWalletLabel } from '@suite-common/local-first-storage';
import { TrezorDevice } from '@suite-common/suite-types';
import { BaseCurrencyAmount } from '@suite-common/wallet-utils';
import { HStack, Radio, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type WalletItemBaseVariant = 'standard' | 'passphrase';

type WalletItemBaseProps = {
    variant: WalletItemBaseVariant;
    onPress: () => void;
    isSelectable: boolean;
    isSelected: boolean;
    device: TrezorDevice;
    baseCurrencyAmount?: BaseCurrencyAmount;
};

type WalletItemBaseStyleProps = { isSelected: boolean; isSelectable: boolean };

const walletItemBaseStyle = prepareNativeStyle<WalletItemBaseStyleProps>(
    (utils, { isSelected, isSelectable }) => ({
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60,
        gap: utils.spacings.sp12,
        borderRadius: utils.borders.radii.r12,
        borderColor: utils.colors.borderOnElevation1,
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
    device,
    baseCurrencyAmount,
}: WalletItemBaseProps) => {
    const { applyStyle } = useNativeStyles();
    const isStandard = variant === 'standard';

    const localFirstWalletLabel = useSelector((state: WithLabelingState) =>
        selectWalletLabel({ state, deviceStaticSessionId: device.state?.staticSessionId }),
    );

    const walletNameLabel =
        // eslint-disable-next-line no-nested-ternary
        localFirstWalletLabel !== null ? (
            localFirstWalletLabel
        ) : isStandard ? (
            <Translation id="deviceManager.wallet.standard" />
        ) : (
            <Translation
                id="deviceManager.wallet.defaultPassphrase"
                values={{ index: device?.walletNumber }}
            />
        );

    const debug =
        device.state?.staticSessionId?.split('@')[0].slice(-8) +
        ' @ ' +
        device.state?.staticSessionId?.slice(-8) +
        ' E: ' +
        device.localFirstStorageSecret?.evoluKeys?.ownerId.slice(-8);

    return (
        <Pressable onPress={onPress}>
            <HStack style={applyStyle(walletItemBaseStyle, { isSelected, isSelectable })}>
                <VStack>
                    <HStack alignItems="center" flex={1}>
                        <Icon name={isStandard ? 'wallet' : 'password'} size="mediumLarge" />
                        <Text variant="callout" numberOfLines={1} style={applyStyle(labelStyle)}>
                            {walletNameLabel}
                        </Text>
                    </HStack>
                    <Text>{debug}</Text>
                </VStack>
                <HStack alignItems="center" spacing="sp12">
                    {baseCurrencyAmount && (
                        <BaseCurrencyAmountFormatter
                            value={baseCurrencyAmount}
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
