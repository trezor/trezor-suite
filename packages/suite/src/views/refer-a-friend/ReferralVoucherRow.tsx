import { useIntl } from 'react-intl';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type ReferralVoucher, getDaysUntil } from '@suite-common/refer-a-friend';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    Badge,
    Button,
    IconCircle,
    type IconComponent,
    Row,
    Table,
    Text,
    Tooltip,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { copyToClipboard } from '@trezor/dom-utils';
import {
    CheckIcon,
    CopyIcon,
    GiftIcon,
    InfoIcon,
    ProhibitIcon,
    SunHorizonIcon,
} from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

type VoucherState = {
    icon: IconComponent;
    intent: 'brand' | 'neutral' | 'critical';
    label: TranslationKey;
};

const voucherStates = {
    available: { icon: GiftIcon, intent: 'brand', label: 'TR_REFERRAL_VOUCHER_READY' },
    pending: {
        icon: GiftIcon,
        intent: 'neutral',
        label: 'TR_REFERRAL_VOUCHER_PENDING',
    },
    used: { icon: CheckIcon, intent: 'neutral', label: 'TR_REFERRAL_VOUCHER_USED' },
    canceled: {
        icon: ProhibitIcon,
        intent: 'critical',
        label: 'TR_REFERRAL_VOUCHER_CANCELED',
    },
    expired: {
        icon: SunHorizonIcon,
        intent: 'neutral',
        label: 'TR_REFERRAL_VOUCHER_EXPIRED',
    },
} as const satisfies Record<ReferralVoucher['status'], VoucherState>;

const getVoucherTooltip = (voucher: ReferralVoucher, formatExpiry: (date: string) => string) => {
    switch (voucher.status) {
        case 'pending':
            return (
                <Translation
                    id="TR_REFERRAL_VOUCHER_AVAILABLE_IN"
                    values={{ days: getDaysUntil(voucher.availableAt) }}
                />
            );
        case 'available':
            return voucher.expiresAt === null ? undefined : (
                <Translation
                    id="TR_REFERRAL_VOUCHER_EXPIRATION"
                    values={{ date: formatExpiry(voucher.expiresAt) }}
                />
            );
        case 'expired':
            return (
                <Translation
                    id="TR_REFERRAL_VOUCHER_EXPIRED_ON"
                    values={{ date: formatExpiry(voucher.expiresAt) }}
                />
            );
        default:
            return undefined;
    }
};

type ReferralVoucherRowProps = {
    voucher: ReferralVoucher;
    voucherNumber: number;
    amount: string;
};

export const ReferralVoucherRow = ({ voucher, voucherNumber, amount }: ReferralVoucherRowProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    const { formatDate } = useIntl();
    const config = voucherStates[voucher.status];
    const voucherCode = voucher.code;
    const isInactive = ['used', 'canceled', 'expired'].includes(voucher.status);
    const formatExpiry = (date: string) =>
        formatDate(date, { dateStyle: 'medium', timeZone: 'UTC' });
    const tooltip = getVoucherTooltip(voucher, formatExpiry);

    const copyCode = async (code: string) => {
        const result = await copyToClipboard(code);
        dispatch(
            notificationsActions.addToast(
                result === true
                    ? { type: 'copy-to-clipboard' }
                    : { type: 'error', error: translationString('TR_REFERRAL_COPY_FAILED') },
            ),
        );
    };

    return (
        <Table.Row data-testid={`@referral/voucher/${voucherNumber}`}>
            <Table.Cell>
                <Row gap={16}>
                    <IconCircle icon={config.icon} size={32} intent={config.intent} />
                    <Text typographyStyle="body-md">
                        <Translation
                            id="TR_REFERRAL_VOUCHER_NUMBER"
                            values={{ number: voucherNumber }}
                        />
                    </Text>
                </Row>
            </Table.Cell>
            <Table.Cell>
                <Tooltip isActive={tooltip !== undefined} content={tooltip} placement="bottom">
                    <Badge
                        intent={config.intent}
                        size="medium"
                        iconLeft={tooltip ? InfoIcon : undefined}
                        data-testid={`@referral/voucher/${voucherNumber}/status`}
                    >
                        <Translation id={config.label} />
                    </Badge>
                </Tooltip>
            </Table.Cell>
            <Table.Cell>
                <Text
                    as={isInactive ? 's' : 'span'}
                    typographyStyle="body-md"
                    intent="neutral"
                    priority="secondary"
                    isDisabled={voucher.status === 'used'}
                >
                    {amount}
                </Text>
            </Table.Cell>
            <Table.Cell align="end">
                {voucherCode === null ? (
                    <Text intent="neutral" priority="secondary">
                        -
                    </Text>
                ) : (
                    <Button
                        intent="neutral"
                        priority="secondary"
                        size="small"
                        iconRight={CopyIcon}
                        isDisabled={voucher.status !== 'available'}
                        onClick={() => copyCode(voucherCode)}
                        data-testid={`@referral/voucher/${voucherNumber}/copy`}
                    >
                        {isInactive ? <s>{voucherCode}</s> : voucherCode}
                    </Button>
                )}
            </Table.Cell>
        </Table.Row>
    );
};
