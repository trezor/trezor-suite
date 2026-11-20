import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type ReferralVoucherStatus } from '@suite-common/refer-a-friend';
import {
    Badge,
    BottomSheetModal,
    Box,
    Button,
    Card,
    CardDivider,
    HStack,
    IconCircle,
    type IconCircleIntent,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CopyVoucherCodeButton } from './CopyVoucherCodeButton';
import { type VoucherProps } from '../hooks/useReferAFriend';

type VoucherListItemProps = {
    voucher: VoucherProps;
    ordinal: number;
};

type ItemConfig = {
    icon: IconName;
    badge: TxKeyPath;
    intent: IconCircleIntent;
    availability: TxKeyPath;
    isUnusable: boolean;
};

const voucherStatusToItemConfig = {
    pending: {
        icon: 'gift',
        badge: 'referAFriend.voucherList.statuses.pending',
        intent: 'neutral',
        availability: 'referAFriend.voucherList.propertyLabels.availableIn',
        isUnusable: false,
    },
    available: {
        icon: 'gift',
        badge: 'referAFriend.voucherList.statuses.available',
        intent: 'brand',
        availability: 'referAFriend.voucherList.propertyLabels.expirationDate',
        isUnusable: false,
    },
    used: {
        icon: 'check',
        badge: 'referAFriend.voucherList.statuses.used',
        intent: 'neutral',
        availability: 'referAFriend.voucherList.propertyLabels.expirationDate',
        isUnusable: true,
    },
    canceled: {
        icon: 'prohibit',
        badge: 'referAFriend.voucherList.statuses.canceled',
        intent: 'critical',
        availability: 'referAFriend.voucherList.propertyLabels.expirationDate',
        isUnusable: true,
    },
    expired: {
        icon: 'sunHorizon',
        badge: 'referAFriend.voucherList.statuses.expired',
        intent: 'neutral',
        availability: 'referAFriend.voucherList.propertyLabels.expiredOn',
        isUnusable: true,
    },
} as const satisfies Record<ReferralVoucherStatus, ItemConfig>;

const labelStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
}));

type VoucherPropertyProps = {
    label: ReactNode;
    value: string | null;
    isUnusable?: boolean;
};

const voucherPropertyValueStyle = prepareNativeStyle(({ colors }) => ({
    color: colors.contentTertiary,
    textDecorationLine: 'line-through',
}));

const VoucherProperty = ({ label, value, isUnusable }: VoucherPropertyProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack justifyContent="space-between">
            <Text color="contentSecondary">{label}</Text>
            <Text style={isUnusable ? applyStyle(voucherPropertyValueStyle) : undefined}>
                {value ?? '-'}
            </Text>
        </HStack>
    );
};

export const VoucherListItem = ({ voucher, ordinal }: VoucherListItemProps) => {
    const { icon, badge, intent, availability, isUnusable } =
        voucherStatusToItemConfig[voucher.status];

    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const { DateFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity onPress={openModal}>
            <HStack margin="sp16" alignItems="center" spacing="sp12">
                <IconCircle name={icon} intent={intent} size={32} />
                <Text style={applyStyle(labelStyle)}>
                    <Translation id="referAFriend.voucherList.label" values={{ ordinal }} />
                </Text>
                <Badge label={<Translation id={badge} />} intent={intent} />
                <Icon name="caretRight" size={20} color="contentSecondary" />
            </HStack>
            <BottomSheetModal ref={bottomSheetRef} isCloseDisplayed={false}>
                <VStack spacing="sp16">
                    <HStack alignItems="center" spacing="sp12">
                        <IconCircle name={icon} intent={intent} size={32} />
                        <Text variant="headline-sm" style={applyStyle(labelStyle)}>
                            <Translation id="referAFriend.voucherList.label" values={{ ordinal }} />
                        </Text>
                        <Badge label={<Translation id={badge} />} intent={intent} />
                    </HStack>
                    <Card>
                        <VStack spacing="sp12">
                            <VoucherProperty
                                label={
                                    <Translation id="referAFriend.voucherList.propertyLabels.amount" />
                                }
                                value={voucher.amount}
                                isUnusable={isUnusable}
                            />
                            <CardDivider />
                            <VoucherProperty
                                label={<Translation id={availability} />}
                                value={
                                    voucher.expiresAt
                                        ? DateFormatter.format(new Date(voucher.expiresAt))
                                        : null
                                }
                            />
                            <CardDivider />
                            <VoucherProperty
                                label={
                                    <Translation id="referAFriend.voucherList.propertyLabels.code" />
                                }
                                value={voucher.voucher}
                                isUnusable={isUnusable}
                            />
                            {/* TODO: Simplify the condition */}
                            {voucher.status === 'available' && voucher.voucher && (
                                <VStack spacing="sp16">
                                    <CardDivider />
                                    <CopyVoucherCodeButton code={voucher.voucher} />
                                </VStack>
                            )}
                        </VStack>
                    </Card>
                    <Box marginTop="sp16">
                        <Button onPress={closeModal} intent="neutral" priority="secondary">
                            <Translation id="generic.buttons.close" />
                        </Button>
                    </Box>
                </VStack>
            </BottomSheetModal>
        </PressableOpacity>
    );
};
