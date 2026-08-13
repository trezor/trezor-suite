import { useDispatch, useSelector } from 'react-redux';

import styled, { css } from 'styled-components';

import { AddressLabeling, copyAddressToClipboard } from '@suite/address';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { type SelectIsLabelActionEnabledState, selectIsLabelActionEnabled } from '@suite/labeling';
import { useServices } from '@suite-common/dependency-injection';
import { type ReceiveRootState, selectCurrentFreshAddress } from '@suite-common/receive';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { IconButton, Row, Text } from '@trezor/components';
import { CopyIcon, ShareNetworkIcon, ShieldCheckIcon } from '@trezor/icons';
import { belowBreakpoint, breakpoints } from '@trezor/theme';

import { type ReceiveAddressItem } from './address/buildReceiveAddressItems';
import { type ReceiveAmountComponent } from './receive';
import { canShareAddress, shareAddress } from './sharing/share';

const ADDRESS_MAX_WIDTH = 300;
// Labeling reserves room next to the address for its edit button, but only while the label action
// is enabled, and it takes more of it on hover. The actions have to keep out of the way of both.
const ACTIONS_GAP_WITHOUT_LABEL_ACTION = 8;
const ACTIONS_GAP_ON_LABEL_HOVER = 24;

const revealed = css`
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
`;

const Label = styled.div`
    min-width: 0;
`;

const Actions = styled.div<{ $hasLabelAction: boolean }>`
    flex: none;
    margin-left: ${({ $hasLabelAction }) =>
        $hasLabelAction ? 0 : ACTIONS_GAP_WITHOUT_LABEL_ACTION}px;
    opacity: 0;
    pointer-events: none;
    transform: translateX(-8px);
    transition:
        opacity 0.2s ease-in-out,
        transform 0.2s ease-in-out,
        margin-left 0.2s ease-in-out;

    &:focus-within {
        ${revealed}
    }

    ${({ $hasLabelAction }) =>
        $hasLabelAction &&
        css`
            ${Label}:hover + & {
                margin-left: ${ACTIONS_GAP_ON_LABEL_HOVER}px;
            }
        `}
`;

const Wrapper = styled.div`
    &:hover ${Actions} {
        ${revealed}
    }

    @media ${belowBreakpoint(breakpoints.tablet)} {
        ${Actions} {
            ${revealed}
        }
    }
`;

type AddressHistoryRowProps = {
    item: ReceiveAddressItem;
    accountKey: AccountKey;
    disabled: boolean;
    isVerifyLoading: boolean;
    isVerifyDisabled: boolean;
    AmountComponent: ReceiveAmountComponent;
    onCopied: (path: string) => void;
    onVerify: (path: string) => void;
};

export const AddressHistoryRow = ({
    item,
    accountKey,
    disabled,
    isVerifyLoading,
    isVerifyDisabled,
    AmountComponent,
    onCopied,
    onVerify,
}: AddressHistoryRowProps) => {
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isLabelActionEnabled = useSelector((state: SelectIsLabelActionEnabledState) =>
        account ? selectIsLabelActionEnabled(state, account.deviceState, accountKey) : false,
    );
    const currentFreshAddress = useSelector((state: ReceiveRootState) =>
        selectCurrentFreshAddress(state, accountKey),
    );
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

    return (
        <Wrapper data-testid={`@wallet/receive/used-address/${item.pathIndex}`}>
            <Row gap={16} justifyContent="space-between" padding={{ vertical: 16, horizontal: 24 }}>
                <Row gap={16} minWidth={0}>
                    {item.pathIndex !== undefined && (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {item.pathIndex}
                        </Text>
                    )}
                    <Row minWidth={0}>
                        <Label>
                            <Text typographyStyle="body-sm">
                                <AddressLabeling
                                    accountDescriptor={account.descriptor}
                                    networkSymbol={account.symbol}
                                    deviceStaticSessionId={account.deviceState}
                                    address={item.address}
                                    label={item.label}
                                    maxWidth={ADDRESS_MAX_WIDTH}
                                />
                            </Text>
                        </Label>
                        <Actions $hasLabelAction={isLabelActionEnabled}>
                            <Row gap={4}>
                                <IconButton
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    icon={CopyIcon}
                                    tooltip={{ content: <Translation id="RECEIVE_COPY_ADDRESS" /> }}
                                    data-testid={`@wallet/receive/used-address/${item.pathIndex}/copy-button`}
                                    onClick={handleCopy}
                                />
                                {canShareAddress() && (
                                    <IconButton
                                        size="small"
                                        intent="neutral"
                                        priority="secondary"
                                        icon={ShareNetworkIcon}
                                        tooltip={{ content: <Translation id="RECEIVE_SHARE" /> }}
                                        data-testid={`@wallet/receive/used-address/${item.pathIndex}/share-button`}
                                        onClick={handleShare}
                                    />
                                )}
                                <IconButton
                                    size="small"
                                    intent="neutral"
                                    priority="secondary"
                                    icon={ShieldCheckIcon}
                                    isDisabled={disabled || isVerifyDisabled}
                                    isLoading={isVerifyLoading}
                                    tooltip={{ content: <Translation id="TR_VERIFY" /> }}
                                    data-testid={`@wallet/receive/used-address/${item.pathIndex}/verify-button`}
                                    onClick={() => onVerify(item.path)}
                                />
                            </Row>
                        </Actions>
                    </Row>
                </Row>
                <Text typographyStyle="body-sm">
                    {item.received ? (
                        <AmountComponent value={item.received} symbol={account.symbol} />
                    ) : (
                        <Text intent="neutral" priority="secondary">
                            <Translation id="RECEIVE_TABLE_NOT_USED" />
                        </Text>
                    )}
                </Text>
            </Row>
        </Wrapper>
    );
};
