import { useDispatch, useSelector } from 'react-redux';

import { AddressLabeling, copyAddressToClipboard } from '@suite/address';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { type ReceiveRootState, selectCurrentFreshAddress } from '@suite-common/receive';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Box, Button, Column, Flex, Row, Text, useMediaQuery } from '@trezor/components';
import { CopyIcon, ShareNetworkIcon, ShieldCheckIcon } from '@trezor/icons';
import { belowBreakpoint, breakpoints } from '@trezor/theme';

import { CoinQrCode } from './CoinQrCode';
import { type ReceiveAddressItem } from './address/buildReceiveAddressItems';
import { canShareAddress, shareAddress } from './sharing/share';

const QR_SIZE = 148;

type AddressCardDetailProps = {
    item: ReceiveAddressItem;
    accountKey: AccountKey;
    disabled: boolean;
    isVerifyLoading: boolean;
    isVerifyDisabled: boolean;
    onCopied: (path: string) => void;
    onVerify: (path: string) => void;
};

export const AddressCardDetail = ({
    item,
    accountKey,
    disabled,
    isVerifyLoading,
    isVerifyDisabled,
    onCopied,
    onVerify,
}: AddressCardDetailProps) => {
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const currentFreshAddress = useSelector((state: ReceiveRootState) =>
        selectCurrentFreshAddress(state, accountKey),
    );
    const isBelowTablet = useMediaQuery(belowBreakpoint(breakpoints.tablet));
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const handleCopy = () => {
        dispatch(copyAddressToClipboard(item.address));
        analytics.report({
            type: events.receiveCopyAddressEvent.name,
            payload: { isFreshAddress: currentFreshAddress?.path === item.path },
        });
        onCopied(item.path);
    };

    const handleShare = () => {
        shareAddress(item.address);
        analytics.report({ type: events.receiveShareAddressEvent.name });
    };

    if (!account) {
        return null;
    }

    const isUtxo = isUtxoBased(account);

    return (
        <Box padding={24}>
            <Flex
                direction={isBelowTablet ? 'column' : 'row'}
                gap={24}
                alignItems="stretch"
                justifyContent="space-between"
            >
                <Column gap={32} alignItems="flex-start" justifyContent="space-between">
                    <Column gap={isUtxo ? 8 : 16} alignItems="flex-start">
                        {isUtxo ? (
                            item.pathIndex !== undefined && (
                                <Text
                                    typographyStyle="body-md"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="RECEIVE_TABLE_ADDRESS" /> #{item.pathIndex}
                                </Text>
                            )
                        ) : (
                            <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                                <Translation id="RECEIVE_ADDRESS_TITLE" />
                            </Text>
                        )}
                        <Text typographyStyle="headline-md" data-testid="@wallet/receive/address">
                            <AddressLabeling
                                accountDescriptor={account.descriptor}
                                networkSymbol={account.symbol}
                                deviceStaticSessionId={account.deviceState}
                                address={item.address}
                                label={item.label}
                            />
                        </Text>
                    </Column>
                    <Row gap={12} flexWrap="wrap">
                        <Button
                            size="large"
                            iconLeft={CopyIcon}
                            data-testid="@wallet/receive/copy-address-button"
                            onClick={handleCopy}
                        >
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </Button>
                        {canShareAddress() && (
                            <Button
                                size="large"
                                intent="neutral"
                                priority="secondary"
                                iconLeft={ShareNetworkIcon}
                                data-testid="@wallet/receive/share-address-button"
                                onClick={handleShare}
                            >
                                <Translation id="RECEIVE_SHARE" />
                            </Button>
                        )}
                        <Button
                            size="large"
                            intent="neutral"
                            priority="secondary"
                            iconLeft={ShieldCheckIcon}
                            isDisabled={disabled || isVerifyDisabled}
                            isLoading={isVerifyLoading}
                            data-testid="@wallet/receive/verify-address-button"
                            onClick={() => onVerify(item.path)}
                        >
                            <Translation id="TR_VERIFY" />
                        </Button>
                    </Row>
                </Column>
                <Box aspectRatio="1" width={QR_SIZE} height={QR_SIZE} flex="none">
                    <CoinQrCode value={item.address} symbol={account.symbol} />
                </Box>
            </Flex>
        </Box>
    );
};
