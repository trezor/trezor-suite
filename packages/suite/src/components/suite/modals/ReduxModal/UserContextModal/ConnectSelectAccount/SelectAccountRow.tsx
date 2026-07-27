import { type MouseEvent, type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { type SelectAccountCandidate } from '@suite-common/connect-popup';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config/src/utils';
import {
    Badge,
    Button,
    Card,
    Checkbox,
    Column,
    Icon,
    Row,
    Skeleton,
    Text,
} from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { ArrowsClockwiseIcon, CaretRightIcon, CheckIcon, WarningIcon } from '@trezor/icons';
import {
    NetworkIcon,
    isNetworkSymbolWithIcon,
    mapTrezorModelToIcon,
} from '@trezor/product-components';

interface SelectAccountRowProps {
    candidate: SelectAccountCandidate;
    // "Account #N" (account-index list) or "Address #N" (UTXO addressSelection: 'manual')
    label: ReactNode;
    // 'toggle': checkbox-driven select/export (needs a value to be interactive).
    // 'drillIn': the whole row navigates onward (e.g. pick account -> view its addresses); no
    //            value needed since nothing is exported at this step.
    // 'readOnly': exported/read-only display, not clickable.
    interactionMode: 'toggle' | 'drillIn' | 'readOnly';
    disabled: boolean;
    // Set while the picker is still deriving accounts on the device. Verifying or retrying now would
    // fire a second, competing device call, so both buttons are disabled until discovery settles.
    discovering: boolean;
    deviceModelInternal?: DeviceModelInternal;
    onToggle: () => void;
    onVerify: () => void;
    onRetry: () => void;
}

const truncateAddress = (address: string) =>
    address.length > 24 ? `${address.slice(0, 12)}…${address.slice(-8)}` : address;

const stop = (e: MouseEvent) => e.stopPropagation();

export const SelectAccountRow = ({
    candidate,
    label,
    interactionMode,
    disabled,
    discovering,
    deviceModelInternal,
    onToggle,
    onVerify,
    onRetry,
}: SelectAccountRowProps) => {
    const {
        accountIndex,
        address,
        xpub,
        balance,
        symbol,
        loading,
        loadFailed,
        verifying,
        validated,
        selected,
    } = candidate;
    // `address` (individual address) and `xpub` (whole-account, UTXO only) are mutually exclusive.
    const displayValue = address ?? xpub;
    const showCheckbox = interactionMode === 'toggle';
    // 'drillIn' rows don't export a value, so they're interactive as soon as they've loaded.
    const interactive =
        interactionMode !== 'readOnly' &&
        !disabled &&
        !loading &&
        !loadFailed &&
        (interactionMode === 'toggle' ? !!displayValue : true);

    const renderRightColumn = () => {
        if (loading) {
            return (
                <>
                    <Skeleton width={48} height={16} />
                    <Skeleton width={80} height={32} borderRadius="full" />
                </>
            );
        }
        if (loadFailed) {
            return (
                <Row onClick={stop}>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        size="small"
                        iconLeft={ArrowsClockwiseIcon}
                        isDisabled={disabled || discovering}
                        onClick={onRetry}
                        data-testid={`@connect-select-account/retry-button/${accountIndex}`}
                    >
                        <Translation id="TR_RETRY" />
                    </Button>
                </Row>
            );
        }

        if (interactionMode === 'drillIn') {
            return (
                <Row alignItems="center" gap={8}>
                    <Text typographyStyle="body-sm">
                        {balance ?? '0'} {getNetworkDisplaySymbol(symbol)}
                    </Text>
                    <Icon as={CaretRightIcon} size={16} intent="neutral" />
                </Row>
            );
        }

        return (
            <>
                <Text typographyStyle="body-sm">
                    {balance ?? '0'} {getNetworkDisplaySymbol(symbol)}
                </Text>
                {displayValue && (
                    <Row alignItems="center" gap={8} onClick={stop}>
                        {validated === 'valid' && (
                            <Badge
                                intent="brand"
                                iconLeft={CheckIcon}
                                size="small"
                                data-testid={`@connect-select-account/verified-badge/${accountIndex}`}
                            >
                                <Translation id="TR_VERIFIED" />
                            </Badge>
                        )}
                        {validated === 'failed' && (
                            <Badge
                                intent="warning"
                                iconLeft={WarningIcon}
                                size="small"
                                data-testid={`@connect-select-account/error-badge/${accountIndex}`}
                            >
                                <Translation id="TR_VERIFICATION_CANCELED" />
                            </Badge>
                        )}
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            iconLeft={
                                deviceModelInternal
                                    ? mapTrezorModelToIcon[deviceModelInternal]
                                    : undefined
                            }
                            isLoading={verifying}
                            isDisabled={disabled || discovering}
                            onClick={onVerify}
                            data-testid={`@connect-select-account/verify-button/${accountIndex}`}
                        >
                            {verifying ? (
                                <Translation id="TR_VERIFYING" />
                            ) : (
                                <Translation id="TR_VERIFY" />
                            )}
                        </Button>
                    </Row>
                )}
            </>
        );
    };

    // The second line under the label: the address/xpub value, or nothing while loading or for
    // 'drillIn' rows (which have no value — the chevron in the right column signals the action).
    const renderSecondaryLine = () => {
        if (loading) return <Skeleton width={140} height={16} />;
        if (interactionMode === 'drillIn') return null;

        return (
            <Text typographyStyle="body-xs" isMonospaced color="contentSecondary">
                {displayValue ? truncateAddress(displayValue) : '—'}
            </Text>
        );
    };

    return (
        <Card
            paddingType="tiny"
            onClick={interactive ? onToggle : undefined}
            data-testid={`@connect-select-account/account/${accountIndex}`}
        >
            <Row alignItems="center" gap={12}>
                {showCheckbox && (
                    <div onClick={stop} role="presentation">
                        <Checkbox
                            isChecked={selected}
                            isDisabled={!interactive}
                            onChange={onToggle}
                            data-testid={`@connect-select-account/checkbox/${accountIndex}`}
                        />
                    </div>
                )}

                {isNetworkSymbolWithIcon(symbol) && (
                    <NetworkIcon networkSymbol={symbol} size={24} />
                )}

                <Column gap={2} flex="1" minWidth={0} alignItems="flex-start">
                    <Text typographyStyle="body-sm-strong">{label}</Text>
                    {renderSecondaryLine()}
                </Column>

                <Column alignItems="flex-end" gap={8}>
                    {renderRightColumn()}
                </Column>
            </Row>
        </Card>
    );
};
