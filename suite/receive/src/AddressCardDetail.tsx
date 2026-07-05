import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type SelectAccountLabelState, selectAccountLabel } from '@suite/account';
import {
    Address,
    type SelectAddressLabelState,
    copyAddressToClipboard,
    selectAddressLabel,
} from '@suite/address';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { Labeling, processLegacyMetadataIntoSuiteSyncThunk } from '@suite/labeling';
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
import { getReceiveAddressLabelPayload } from './getReceiveAddressLabelPayload';
import { canShareAddress, shareAddress } from './sharing/share';

const QR_SIZE = 148;

type AddressCardDetailRootState = AccountsRootState &
    ReceiveRootState &
    SelectAccountLabelState &
    SelectAddressLabelState;

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
    const { translationString } = useTranslation();

    const isAccountBased = account !== null && !isUtxoBased(account);

    const currentFreshAddressLabel = useSelector((state: AddressCardDetailRootState) =>
        currentFreshAddress?.address && account
            ? selectAddressLabel(state, {
                  address: currentFreshAddress.address,
                  deviceStaticId: account.deviceState,
              })
            : undefined,
    );

    const accountLabel = useSelector((state: AddressCardDetailRootState) =>
        account && isAccountBased
            ? selectAccountLabel(state, {
                  accountDescriptor: account.descriptor,
                  accountKey: account.key,
                  deviceStaticId: account.deviceState,
                  networkSymbol: account.symbol,
              })
            : null,
    );

    // accounts on account based networks have a single receive address, its label and the account label are unified;
    // adopt a previously set address label as the account label and clear it from storage
    useEffect(() => {
        if (
            !account ||
            !isAccountBased ||
            !currentFreshAddress?.address ||
            !currentFreshAddressLabel
        ) {
            return;
        }

        if (!accountLabel) {
            dispatch(
                processLegacyMetadataIntoSuiteSyncThunk({
                    payload: getReceiveAddressLabelPayload(account, currentFreshAddress.address),
                    deviceStaticSessionId: account.deviceState,
                    value: currentFreshAddressLabel,
                }),
            );
        }

        dispatch(
            processLegacyMetadataIntoSuiteSyncThunk({
                payload: {
                    type: 'addressLabel',
                    entityKey: account.key,
                    defaultValue: currentFreshAddress.address,
                    networkSymbol: account.symbol,
                    accountDescriptor: account.descriptor,
                },
                deviceStaticSessionId: account.deviceState,
                value: undefined,
            }),
        );
    }, [
        isAccountBased,
        currentFreshAddress?.address,
        currentFreshAddressLabel,
        accountLabel,
        account,
        dispatch,
    ]);

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
                            <Labeling
                                payload={getReceiveAddressLabelPayload(account, item.address)}
                                {...(!isUtxo && {
                                    'data-testid': `@metadata/receiveAccountLabel/${account.path}/hover-container`,
                                })}
                                deviceStaticSessionId={account.deviceState}
                                displayValue={<Address value={item.address} isTruncated />}
                                placeholder={translationString(
                                    isUtxo
                                        ? 'TR_LABELING_ADDRESS_LABEL'
                                        : 'TR_LABELING_ACCOUNT_LABEL',
                                )}
                                minHeight={28}
                            >
                                {isUtxo ? item.label : accountLabel}
                            </Labeling>
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
