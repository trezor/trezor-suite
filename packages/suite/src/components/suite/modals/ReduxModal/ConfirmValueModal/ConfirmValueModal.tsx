import { ReactNode, useEffect, useState } from 'react';

import { selectAddressLabels } from '@suite-common/suite-sync';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
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
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { MODAL } from 'src/actions/suite/constants';
import { AccountLabel, Address, Labeling } from 'src/components/suite';
import { QrCode } from 'src/components/suite/QrCode';
import { Translation } from 'src/components/suite/Translation';
import { useGuideOpenNode } from 'src/hooks/guide';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { useLabelingCombined } from 'src/hooks/suite/useLabelingCombined';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { selectIsActionAbortable } from 'src/selectors/suite/suiteSelectors';
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
    value,
}: ConfirmValueModalProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const { device, isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const modalContext = useSelector(state => state.modal.context);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const { accountLabel, addressLabels } = useSelector(selectLabelingDataForSelectedAccount);
    const dispatch = useDispatch();
    const { openNodeById } = useGuideOpenNode();
    const { translationString } = useTranslation();

    const { isSuiteSyncEnabled, legacyMetadataState } = useLabelingCombined({
        deviceStaticSessionId: account!.deviceState,
    });
    // block labeling if metadata needs to be enabled on device until receive address is confirmed (device locked)
    const isMetadataBlockedByDeviceCall =
        isDeviceLocked &&
        !isSuiteSyncEnabled &&
        (!legacyMetadataState.enabled || legacyMetadataState.providers.length === 0);

    const suiteSyncAddressLabels = useSelector(state =>
        account
            ? selectAddressLabels({ state, deviceStaticSessionId: account.deviceState })
            : undefined,
    );

    const canConfirmOnDevice = !!(device?.connected && device?.available);
    const isCancelable = isActionAbortable || isConfirmed;

    const copy = () => {
        const result = copyToClipboard(value);

        if (account) {
            analytics.report({
                type: EventType.CreateReceiveAddressCopyAddress,
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
        <Modal.Backdrop onClick={isCancelable ? onCancel : undefined}>
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
                                account={{
                                    ...account,
                                    accountLabel,
                                }}
                                accountTypeBadgeSize="small"
                                showAccountTypeBadge
                            />
                        </Row>
                    )
                }
                onCancel={isCancelable ? onCancel : undefined}
                size="small"
            >
                <Column gap={spacings.md}>
                    {!device?.connected && (
                        <Banner icon="warning" intent="warning">
                            <Paragraph typographyStyle="hint">
                                <Translation
                                    id="TR_DEVICE_LABEL_IS_NOT_CONNECTED"
                                    values={{ deviceLabel }}
                                />
                            </Paragraph>
                            <Paragraph typographyStyle="label">
                                <Translation id="TR_PLEASE_CONNECT_YOUR_DEVICE" />
                            </Paragraph>
                        </Banner>
                    )}
                    {(account?.networkType === 'ripple' || account?.networkType === 'stellar') && (
                        <Banner intent="info" icon="info">
                            <Translation
                                id="DESTINATION_TAG_BANNER_RECEIVE"
                                values={{
                                    a: chunks => (
                                        <Link
                                            variant="nostyle"
                                            icon="arrowUpRight"
                                            typographyStyle="hint"
                                            onClick={handleOpenGuide}
                                        >
                                            {chunks}
                                        </Link>
                                    ),
                                    displaySymbol: getDisplaySymbol(account.symbol),
                                }}
                            />
                        </Banner>
                    )}
                    <Card fillType="flat" paddingType="large">
                        <Row gap={32} alignItems="stretch" data-testid="@modal/output-address">
                            <Box aspectRatio="1" width={170} height={170}>
                                <QrCode value={value} />
                            </Box>
                            <Column gap={12} alignItems="flex-start">
                                {account ? (
                                    <Labeling
                                        deviceStaticSessionId={account.deviceState}
                                        isDisabled={isMetadataBlockedByDeviceCall}
                                        displayValue={
                                            <Text typographyStyle="highlight">
                                                <Translation id="TR_LABELING_ADD_ADDRESS_LABEL" />
                                            </Text>
                                        }
                                        placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
                                        leftAddon={
                                            addressLabel ? undefined : (
                                                <Icon name="tag" size={16} variant="tertiary" />
                                            )
                                        }
                                        payload={{
                                            type: 'addressLabel',
                                            entityKey: account.key,
                                            defaultValue: value,
                                            networkSymbol: account.symbol,
                                            accountDescriptor: account.descriptor,
                                            value: addressLabel,
                                        }}
                                        maxWidth={255}
                                    >
                                        {addressLabel}
                                    </Labeling>
                                ) : (
                                    label
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
                    <Card>
                        <Row gap={spacings.lg}>
                            <IconCircle
                                hasBorder={false}
                                variant="info"
                                size={32}
                                name="warningFilled"
                            />
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
                                <Paragraph variant="tertiary" textWrap="pretty">
                                    <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_1_DESCRIPTION" />
                                </Paragraph>
                            </BulletList.Item>
                            <BulletList.Item
                                title={
                                    <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_2_HEADING" />
                                }
                            >
                                <Paragraph variant="tertiary" textWrap="pretty">
                                    <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_2_DESCRIPTION" />
                                </Paragraph>
                            </BulletList.Item>
                            <BulletList.Item
                                title={
                                    <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_3_HEADING" />
                                }
                            >
                                <Paragraph variant="tertiary" textWrap="pretty">
                                    <Translation id="TR_RECEIVE_ADDRESS_CONFIRMATION_ITEM_3_DESCRIPTION" />
                                </Paragraph>
                            </BulletList.Item>
                        </BulletList>
                    </Card>
                </Column>
            </Modal.ModalBase>
        </Modal.Backdrop>
    );
};
