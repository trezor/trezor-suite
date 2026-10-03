import { type ReactNode } from 'react';

import { type SelectAccountCandidate } from '@suite-common/connect-popup';
import { isNetworkIconSymbol } from '@suite-common/icons';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    Box,
    BoxSkeleton,
    Button,
    Card,
    CheckBox,
    HStack,
    IconButton,
    PressableOpacity,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon, NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

// 'toggle': checkbox-driven select/export (needs a value to be interactive).
// 'drillIn': the whole row navigates onward (pick account -> view its addresses); no value needed
//            since nothing is exported at this step.
// 'readOnly': exported/read-only display, not clickable.
type InteractionMode = 'toggle' | 'drillIn' | 'readOnly';

type SelectAccountRowProps = {
    candidate: SelectAccountCandidate;
    // "Account #N" (account-index list) or "Address #N" (UTXO addressSelection: 'manual')
    label: ReactNode;
    interactionMode: InteractionMode;
    disabled: boolean;
    // Set while the picker is still deriving accounts on the device. Verifying or retrying now would
    // fire a second, competing device call, so both actions are disabled until discovery settles.
    discovering: boolean;
    onToggle: () => void;
    onVerify: () => void;
    onRetry: () => void;
};

const truncateValue = (value: string) =>
    value.length > 20 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;

export const SelectAccountRow = ({
    candidate,
    label,
    interactionMode,
    disabled,
    discovering,
    onToggle,
    onVerify,
    onRetry,
}: SelectAccountRowProps) => {
    const { address, xpub, balance, symbol, loading, loadFailed, verifying, validated, selected } =
        candidate;
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

    const balanceText = (
        <Text variant="body-sm" color="contentSecondary">
            {balance ?? '0'} {getNetworkDisplaySymbol(symbol)}
        </Text>
    );

    const renderRightColumn = () => {
        if (loading) {
            return <BoxSkeleton width={40} height={40} borderRadius={10} />;
        }
        if (loadFailed) {
            return (
                <Button
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    iconLeft="arrowsClockwise"
                    isDisabled={disabled || discovering}
                    onPress={onRetry}
                >
                    <Translation id="moduleConnectPopup.selectAccount.retry" />
                </Button>
            );
        }
        // 'drillIn' rows export nothing — the balance and a chevron signal navigation, no verify.
        if (interactionMode === 'drillIn') {
            return (
                <HStack alignItems="center" spacing="sp4">
                    {balanceText}
                    <Icon name="caretRight" size="medium" color="contentTertiary" />
                </HStack>
            );
        }
        if (!displayValue) return null;

        // Verification stays available even after export (mirrors AddressConfirmation), so the button
        // shows for read-only/exported rows too. The button state is the "verified" indicator (brand
        // check), keeping the row tight — a failed attempt adds a small warning icon.
        return (
            <HStack alignItems="center" spacing="sp8">
                {validated === 'failed' && (
                    <Icon name="warningCircle" size="mediumLarge" color="contentWarning" />
                )}
                <IconButton
                    size="medium"
                    intent={validated === 'valid' ? 'brand' : 'neutral'}
                    priority={validated === 'valid' ? 'primary' : 'secondary'}
                    iconName={validated === 'valid' ? 'checkCircle' : 'trezorDevices'}
                    isLoading={verifying}
                    isDisabled={disabled || discovering}
                    onPress={onVerify}
                />
            </HStack>
        );
    };

    // Second line under the label: the address/xpub plus its balance, side by side. 'drillIn' rows
    // have no value — the chevron in the right column signals the action.
    const renderSecondaryLine = () => {
        if (loading) return <BoxSkeleton width={140} height={16} borderRadius={4} />;
        if (interactionMode === 'drillIn') return null;

        return (
            <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
                <Text variant="body-sm" color="contentTertiary">
                    {displayValue ? truncateValue(displayValue) : '—'}
                </Text>
                {balanceText}
            </HStack>
        );
    };

    const content = (
        <Card noPadding>
            <Box padding="sp12">
                <HStack alignItems="center" spacing="sp12">
                    {showCheckbox && (
                        <CheckBox
                            isChecked={selected}
                            isDisabled={!interactive}
                            onChange={onToggle}
                        />
                    )}
                    {isNetworkIconSymbol(symbol) && <NetworkIcon symbol={symbol} size={24} />}
                    <VStack flex={1} spacing="sp2">
                        <Text variant="body-md-strong">{label}</Text>
                        {renderSecondaryLine()}
                    </VStack>
                    {renderRightColumn()}
                </HStack>
            </Box>
        </Card>
    );

    if (!interactive) return content;

    return <PressableOpacity onPress={onToggle}>{content}</PressableOpacity>;
};
