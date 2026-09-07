import { useSelector } from 'react-redux';

import { Address, AddressLabeling, copyAddressToClipboard } from '@suite/address';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { type ReceiveRootState, selectCurrentFreshAddress } from '@suite-common/receive';
import { useDispatch } from '@suite-common/redux-utils';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Box, Button, Column, Grid, Row, Text, useMediaQuery } from '@trezor/components';
import { CopyIcon, ShareNetworkIcon, ShieldCheckIcon } from '@trezor/icons';
import { belowBreakpoint, breakpoints } from '@trezor/theme';

import { CoinQrCode } from './CoinQrCode';
import { type ReceiveAddressItem } from './address/buildReceiveAddressItems';
import { canShareAddress, shareAddress } from './sharing/share';

const QR_CODE_SIZE = 200;
const COMPACT_QR_CODE_SIZE = 148;

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
    const hasLabel = !!item.label;
    const qrCodeSize = isBelowTablet ? COMPACT_QR_CODE_SIZE : QR_CODE_SIZE;

    return (
        <Box padding={24}>
            <Grid
                columns={isBelowTablet ? '1fr' : 'minmax(0, 1fr) auto'}
                gap={24}
                alignItems="stretch"
            >
                <Column
                    gap={32}
                    alignItems="flex-start"
                    justifyContent="space-between"
                    minWidth={0}
                >
                    <Column gap={isUtxo ? 8 : 16} alignItems="flex-start" minWidth={0}>
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
                        <Column gap={8} alignItems="flex-start" minWidth={0}>
                            <AddressLabeling
                                accountDescriptor={account.descriptor}
                                networkSymbol={account.symbol}
                                deviceStaticSessionId={account.deviceState}
                                address={item.address}
                                label={item.label}
                                typographyStyle={hasLabel ? 'headline-sm' : 'headline-md'}
                                isAddressTruncated={false}
                                isDisplayValueMultiline
                                addressDataTestId={hasLabel ? undefined : '@wallet/receive/address'}
                            />
                            {hasLabel && (
                                <Address
                                    value={item.address}
                                    typographyStyle="headline-sm"
                                    data-testid="@wallet/receive/address"
                                />
                            )}
                        </Column>
                    </Column>
                    <Row gap={12} flexWrap="wrap" width="100%">
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
                <Box aspectRatio="1" width={qrCodeSize} maxWidth="100%">
                    <CoinQrCode value={item.address} symbol={account.symbol} />
                </Box>
            </Grid>
        </Box>
    );
};
