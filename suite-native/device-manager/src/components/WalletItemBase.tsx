import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncDebugEnabled,
    selectSuiteSyncOwnerForDeviceStaticId,
} from '@suite-common/suite-sync';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { HStack, Radio, Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { WalletLabel, selectIsLabellingAllowed } from '@suite-native/labeling';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type WalletItemBaseVariant = 'standard' | 'passphrase';

type WalletItemBaseProps = {
    variant: WalletItemBaseVariant;
    onPress: () => void;
    isSelectable: boolean;
    isSelected: boolean;
    device?: TrezorDevice;
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

const SuiteSyncWalletDebug = ({ device }: { device?: TrezorDevice }) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const isSuiteSyncDebugEnabled = useSelector(selectIsSuiteSyncDebugEnabled);

    const deviceStaticSessionId = device?.state?.staticSessionId;

    const suiteSyncOwner = useSelector((state: WithSuiteSyncAndDeviceState) =>
        selectSuiteSyncOwnerForDeviceStaticId(state, deviceStaticSessionId),
    );

    if (!isLabellingAllowed || !device || !isSuiteSyncDebugEnabled) {
        return null;
    }

    if (deviceStaticSessionId === undefined) {
        return null;
    }

    const { walletDescriptor, deviceId } = parseDeviceStaticSessionId(deviceStaticSessionId);

    const evoluDebug =
        walletDescriptor.split('@')[0].slice(-8) +
        ' @ ' +
        deviceId.slice(-8) +
        ' E: ' +
        suiteSyncOwner?.slice(-8);

    return <Text>{evoluDebug}</Text>;
};

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

    const fallbackLabel = isStandard ? (
        <Translation id="deviceManager.wallet.standard" />
    ) : (
        <Translation
            id="deviceManager.wallet.defaultPassphrase"
            values={{ index: device?.walletNumber }}
        />
    );

    return (
        <Pressable onPress={onPress}>
            <HStack style={applyStyle(walletItemBaseStyle, { isSelected, isSelectable })}>
                <HStack alignItems="center" flex={1}>
                    <Icon name={isStandard ? 'wallet' : 'password'} size="mediumLarge" />
                    <Text
                        testID="@wallet/label"
                        variant="body-sm-strong"
                        numberOfLines={1}
                        style={applyStyle(labelStyle)}
                    >
                        <WalletLabel
                            deviceStaticSessionId={device?.state?.staticSessionId}
                            fallbackLabel={fallbackLabel}
                        />
                    </Text>
                    <SuiteSyncWalletDebug device={device} />
                </HStack>

                <HStack alignItems="center" spacing="sp12">
                    {baseCurrencyAmount && (
                        <BaseCurrencyAmountFormatter
                            value={baseCurrencyAmount}
                            variant="body-sm"
                            color="textSubdued"
                        />
                    )}
                    {isSelectable && <Radio value="" onPress={onPress} isChecked={isSelected} />}
                </HStack>
            </HStack>
        </Pressable>
    );
};
