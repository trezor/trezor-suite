import { type ReactNode, useEffect, useState } from 'react';

import { AccountLabel } from '@suite/account';
import { Address, selectAddressLabel } from '@suite/address';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation, useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { selectIsMetadataEnabled } from '@suite/metadata';
import { MODAL_CONTEXT_USER } from '@suite/modal';
import { selectDesktopSuiteSyncInteraction } from '@suite/suite-sync';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import {
    Banner,
    Box,
    Button,
    Card,
    Column,
    H3,
    Icon,
    IconCircle,
    Link,
    Modal,
    type ModalProps,
    Paragraph,
    Row,
    StepList,
    Text,
} from '@trezor/components';
import { getDeviceColorVariant } from '@trezor/device-utils';
import { copyToClipboard } from '@trezor/dom-utils';
import {
    CheckIcon,
    CopyIcon,
    InfoIcon,
    TagFilledIcon,
    TagIcon,
    WarningFilledIcon,
    WarningIcon,
} from '@trezor/icons';
import { ConfirmOnDevicePill, QrCode, TokenIcon } from '@trezor/product-components';

import { useGuideOpenNode } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type ThunkAction } from 'src/types/suite';
import { DESTINATION_TAG_GUIDE_PATH } from 'src/views/wallet/send/Options/MiscNetworkOptions/DestinationTag';

export type ConfirmValueModalProps = Pick<ModalProps, 'onCancel' | 'heading'> & {
    account?: Account;
    'data-testid'?: string;
    isConfirmed?: boolean;
    isValueChunked?: boolean;
    label?: ReactNode;
    validateOnDevice: () => ThunkAction;
    value: string;
    isAddress?: boolean;
};

export const ConfirmValueModal = ({
    account,
    'data-testid': copyButtonDataTest,
    heading,
    label,
    isConfirmed,
    isValueChunked,
    onCancel,
    validateOnDevice,
    isAddress = false,
    value,
}: ConfirmValueModalProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const { device } = useDevice();
    const modalContext = useSelector(state => state.modal.context);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const isMetadataEnabled = useSelector(selectIsMetadataEnabled);
    const dispatch = useDispatch();
    const { openNodeById } = useGuideOpenNode();
    const { translationString } = useTranslation();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const suiteSyncInteraction = useSelector(state =>
        account
            ? selectDesktopSuiteSyncInteraction(state, account.deviceState, isMetadataEnabled)
            : null,
    );

    const addressLabel = useSelector(state =>
        account && isAddress
            ? selectAddressLabel(state, {
                  address: value,
                  deviceStaticId: account.deviceState,
              })
            : null,
    );

    const canConfirmOnDevice = !!(device?.connected && device?.available);
    // Do not show Add address label button if there is device interaction needed and device is not connected.
    const shouldShowAddressLabelAction = suiteSyncInteraction === null || !!device?.connected;

    const copy = async () => {
        const result = await copyToClipboard(value);

        if (account) {
            analytics.report({
                type: events.createReceiveAddressCopyAddressEvent.name,
                payload: { assetSymbol: account.symbol },
            });
        }

        if (typeof result !== 'string') {
            setIsCopied(true);
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    const handleOpenGuide = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation();
        openNodeById(DESTINATION_TAG_GUIDE_PATH);
    };

    // Device connected while the modal is open -> validate on device.
    useEffect(() => {
        if (canConfirmOnDevice && modalContext === MODAL_CONTEXT_USER && !isConfirmed) {
            dispatch(validateOnDevice());
        }
    }, [canConfirmOnDevice, dispatch, isConfirmed, modalContext, validateOnDevice]);

    return (
        <Modal.Backdrop onClick={onCancel}>
            {canConfirmOnDevice && (
                <ConfirmOnDevicePill
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={getDeviceInternalModel(device)}
                    deviceUnitColor={getDeviceColorVariant(device)}
                    isConfirmed={isConfirmed}
                />
            )}
            <Modal.ModalBase
                heading={heading}
                description={
                    account && (
                        <Row gap={4}>
                            <TokenIcon size={16} symbol={account.symbol} />
                            <AccountLabel
                                account={account}
                                accountTypeBadgeSize="small"
                                showAccountTypeBadge
                            />
                        </Row>
                    )
                }
                onCancel={onCancel}
                width={600}
            >
                <Column gap={16}>
                    {!device?.connected && (
                        <Banner
                            icon={WarningIcon}
                            intent="warning"
                            description={
                                <>
                                    <Paragraph typographyStyle="body-sm">
                                        <Translation
                                            id="TR_DEVICE_LABEL_IS_NOT_CONNECTED"
                                            values={{ deviceLabel }}
                                        />
                                    </Paragraph>
                                    <Paragraph typographyStyle="body-xs">
                                        <Translation id="TR_PLEASE_CONNECT_YOUR_DEVICE" />
                                    </Paragraph>
                                </>
                            }
                        />
                    )}
                    {(account?.networkType === 'ripple' || account?.networkType === 'stellar') && (
                        <Banner
                            intent="info"
                            icon={InfoIcon}
                            description={
                                <Translation
                                    id="DESTINATION_TAG_BANNER_RECEIVE"
                                    values={{
                                        a: chunks => (
                                            <Link onClick={handleOpenGuide}>{chunks}</Link>
                                        ),
                                        displaySymbol: getDisplaySymbol(account.symbol),
                                    }}
                                />
                            }
                        />
                    )}
                    <Card paddingType="large">
                        <Row gap={32} alignItems="stretch" data-testid="@modal/output-address">
                            <Box aspectRatio="1" width={170} height={170}>
                                <QrCode value={value} />
                            </Box>
                            <Column gap={12} alignItems="flex-start">
                                {isAddress && !account && label}
                                {isAddress && !!account && shouldShowAddressLabelAction && (
                                    <Labeling
                                        deviceStaticSessionId={account.deviceState}
                                        displayValue={
                                            <Text typographyStyle="body-md-strong">
                                                <Translation id="TR_LABELING_ADD_ADDRESS_LABEL" />
                                            </Text>
                                        }
                                        placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
                                        leftAddon={
                                            <Icon
                                                as={addressLabel ? TagFilledIcon : TagIcon}
                                                size={16}
                                                intent="neutral"
                                                priority="secondary"
                                            />
                                        }
                                        payload={{
                                            type: 'addressLabel',
                                            entityKey: account.key,
                                            defaultValue: value,
                                            networkSymbol: account.symbol,
                                            accountDescriptor: account.descriptor,
                                        }}
                                        maxWidth={290}
                                    >
                                        {addressLabel}
                                    </Labeling>
                                )}
                                <Address
                                    value={value}
                                    data-testid="@modal/output-value"
                                    isChunked={isValueChunked}
                                    isDeviceRendered
                                />
                                <Button
                                    onClick={copy}
                                    intent="neutral"
                                    priority="secondary"
                                    data-testid={copyButtonDataTest}
                                    size="small"
                                    iconLeft={isCopied ? CheckIcon : CopyIcon}
                                    margin={{ top: 'auto' }}
                                >
                                    <Translation
                                        id={
                                            isCopied
                                                ? 'TR_COPIED_TO_CLIPBOARD'
                                                : 'TR_COPY_TO_CLIPBOARD'
                                        }
                                    />
                                </Button>
                            </Column>
                        </Row>
                    </Card>
                    {isAddress && (
                        <Card type="contrast">
                            <Row gap={20}>
                                <IconCircle intent="neutral" size={32} icon={WarningFilledIcon} />
                                <H3>
                                    <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_HEADING" />
                                </H3>
                            </Row>
                            <StepList
                                isOrdered
                                margin={{ top: 32 }}
                                gap={20}
                                titleGap={0}
                                bulletGap={20}
                            >
                                <StepList.Item
                                    title={
                                        <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_1_HEADING" />
                                    }
                                >
                                    <Paragraph
                                        intent="neutral"
                                        priority="secondary"
                                        textWrap="pretty"
                                    >
                                        <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_1_DESCRIPTION" />
                                    </Paragraph>
                                </StepList.Item>
                                <StepList.Item
                                    title={
                                        <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_2_HEADING" />
                                    }
                                >
                                    <Paragraph
                                        intent="neutral"
                                        priority="secondary"
                                        textWrap="pretty"
                                    >
                                        <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_2_DESCRIPTION" />
                                    </Paragraph>
                                </StepList.Item>
                                <StepList.Item
                                    title={
                                        <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_3_HEADING" />
                                    }
                                >
                                    <Paragraph
                                        intent="neutral"
                                        priority="secondary"
                                        textWrap="pretty"
                                    >
                                        <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_3_DESCRIPTION" />
                                    </Paragraph>
                                </StepList.Item>
                            </StepList>
                        </Card>
                    )}
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
