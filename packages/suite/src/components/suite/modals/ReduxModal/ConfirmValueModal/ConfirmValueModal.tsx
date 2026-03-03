import { ReactNode, useEffect, useState } from 'react';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { selectLabelingDataForSelectedAccount } from '@suite/metadata';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { selectIsSuiteSyncEnabled, selectSuiteSyncAddressLabels } from '@suite-common/suite-sync';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    Banner,
    Box,
    BulletList,
    Button,
    Card,
    Column,
    H3,
    Icon,
    IconCircle,
    Link,
    Modal,
    ModalProps,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';
import { getDeviceColorVariant } from '@trezor/device-utils';
import { copyToClipboard } from '@trezor/dom-utils';
import { CoinLogo, ConfirmOnDevicePill } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { MODAL } from 'src/actions/suite/constants';
import { AccountLabel } from 'src/components/suite/AccountLabel';
import { Address } from 'src/components/suite/Address';
import { QrCode } from 'src/components/suite/QrCode';
import { Labeling } from 'src/components/suite/labeling';
import { useGuideOpenNode } from 'src/hooks/guide';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';
import { ThunkAction } from 'src/types/suite';
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
    const { device, isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const modalContext = useSelector(state => state.modal.context);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const { addressLabels } = useSelector(selectLabelingDataForSelectedAccount);
    const dispatch = useDispatch();
    const { openNodeById } = useGuideOpenNode();
    const { translationString } = useTranslation();
    const analytics = useAnalytics();
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const legacyMetadataState = useSelector(state => state.metadata);

    // block labeling if metadata needs to be enabled on device until receive address is confirmed (device locked)
    const isMetadataBlockedByDeviceCall =
        isDeviceLocked &&
        !isSuiteSyncEnabled &&
        (!legacyMetadataState.enabled || legacyMetadataState.providers.length === 0);

    const suiteSyncAddressLabels = useSelector(state =>
        account ? selectSuiteSyncAddressLabels(state, account.deviceState) : undefined,
    );

    const canConfirmOnDevice = !!(device?.connected && device?.available);

    const copy = () => {
        const result = copyToClipboard(value);

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
        if (canConfirmOnDevice && modalContext === MODAL.CONTEXT_USER && !isConfirmed) {
            dispatch(validateOnDevice());
        }
    }, [canConfirmOnDevice, dispatch, isConfirmed, modalContext, validateOnDevice]);

    const addressLabel =
        suiteSyncAddressLabels?.find(it => it.address === value)?.label ?? addressLabels[value];

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
                        <Row gap={spacings.xxs}>
                            <CoinLogo size={14} symbol={account.symbol} />
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
                <Column gap={spacings.md}>
                    {!device?.connected && (
                        <Banner
                            icon="warning"
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
                            icon="info"
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
                    <Card fillType="flat" paddingType="large">
                        <Row gap={32} alignItems="stretch" data-testid="@modal/output-address">
                            <Box aspectRatio="1" width={170} height={170}>
                                <QrCode value={value} />
                            </Box>
                            <Column gap={12} alignItems="flex-start">
                                {isAddress &&
                                    (account ? (
                                        <Labeling
                                            deviceStaticSessionId={account.deviceState}
                                            isDisabled={isMetadataBlockedByDeviceCall}
                                            displayValue={
                                                <Text typographyStyle="body-md-strong">
                                                    <Translation id="TR_LABELING_ADD_ADDRESS_LABEL" />
                                                </Text>
                                            }
                                            placeholder={translationString(
                                                'TR_LABELING_ADDRESS_LABEL',
                                            )}
                                            leftAddon={
                                                <Icon
                                                    name={addressLabel ? 'tagFilled' : 'tag'}
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
                                                value: addressLabel,
                                            }}
                                            maxWidth={290}
                                        >
                                            {addressLabel}
                                        </Labeling>
                                    ) : (
                                        label
                                    ))}
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
                                    iconLeft={isCopied ? 'check' : 'copy'}
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
                        <Card>
                            <Row gap={spacings.lg}>
                                <IconCircle intent="info" size={32} name="warningFilled" />
                                <H3>
                                    <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_HEADING" />
                                </H3>
                            </Row>
                            <BulletList
                                isOrdered
                                margin={{ top: spacings.xxxl }}
                                gap={spacings.xl}
                                titleGap={spacings.zero}
                                bulletGap={spacings.lg}
                            >
                                <BulletList.Item
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
                                </BulletList.Item>
                                <BulletList.Item
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
                                </BulletList.Item>
                                <BulletList.Item
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
                                </BulletList.Item>
                            </BulletList>
                        </Card>
                    )}
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
