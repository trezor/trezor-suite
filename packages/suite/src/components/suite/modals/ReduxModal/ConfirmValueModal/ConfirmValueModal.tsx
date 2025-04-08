import { ReactNode, useEffect, useState } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice, selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    Banner,
    Box,
    BulletList,
    Button,
    Card,
    Column,
    H3,
    IconCircle,
    InfoItem,
    Link,
    NewModal,
    NewModalProps,
    Paragraph,
    Row,
} from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { CoinLogo, ConfirmOnDevice } from '@trezor/product-components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { MODAL } from 'src/actions/suite/constants';
import { AccountLabel, Address, Translation } from 'src/components/suite';
import { QrCode } from 'src/components/suite/QrCode';
import { useGuideOpenNode } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { ThunkAction } from 'src/types/suite';
import { DESTINATION_TAG_GUIDE_PATH } from 'src/views/wallet/send/Options/RippleOptions/DestinationTag';

export type ConfirmValueModalProps = Pick<NewModalProps, 'onCancel' | 'heading'> & {
    account?: Account;
    'data-testid'?: string;
    isConfirmed?: boolean;
    areStepsVisible?: boolean;
    isValueChunked?: boolean;
    isCopyButtonVisible?: boolean;
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
    isValueChunked = true,
    isCopyButtonVisible,
    areStepsVisible,
    onCancel,
    validateOnDevice,
    value,
}: ConfirmValueModalProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const device = useSelector(selectSelectedDevice);
    const modalContext = useSelector(state => state.modal.context);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);
    const dispatch = useDispatch();
    const { openNodeById } = useGuideOpenNode();

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

    const handleOpenGuide = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        openNodeById(DESTINATION_TAG_GUIDE_PATH);
    };

    // Device connected while the modal is open -> validate on device.
    useEffect(() => {
        if (canConfirmOnDevice && modalContext === MODAL.CONTEXT_USER && !isConfirmed) {
            dispatch(validateOnDevice());
        }
    }, [canConfirmOnDevice, dispatch, isConfirmed, modalContext, validateOnDevice]);

    const outputValue = (
        <Address value={value} data-testid="@modal/output-value" isChunked={isValueChunked} />
    );

    return (
        <NewModal.Backdrop onClick={isCancelable ? onCancel : undefined}>
            {canConfirmOnDevice && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={device.features?.internal_model}
                    deviceUnitColor={device?.features?.unit_color}
                    isConfirmed={isConfirmed}
                />
            )}
            <NewModal.ModalBase
                heading={heading}
                description={
                    account && (
                        <Row gap={spacings.xxs}>
                            <CoinLogo size={14} symbol={account.symbol} />
                            <AccountLabel
                                accountLabel={accountLabel}
                                accountType={account.accountType}
                                symbol={account.symbol}
                                index={account.index}
                            />
                        </Row>
                    )
                }
                onCancel={isCancelable ? onCancel : undefined}
                size="small"
            >
                <Column gap={spacings.md}>
                    {!device?.connected && (
                        <Banner icon="warning" variant="warning">
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
                    {account?.networkType === 'ripple' && (
                        <Banner variant="info" icon="info">
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
                                }}
                            />
                        </Banner>
                    )}
                    <Card fillType="flat">
                        <Row
                            gap={spacings.xl}
                            alignItems="stretch"
                            data-testid="@modal/output-address"
                        >
                            <Box aspectRatio="1" flex="1 0 auto" minWidth={120}>
                                <QrCode value={value} />
                            </Box>
                            <Column gap={spacings.lg}>
                                {label ? (
                                    <InfoItem label={label}>{outputValue}</InfoItem>
                                ) : (
                                    outputValue
                                )}
                                {isCopyButtonVisible && (
                                    <Button
                                        onClick={copy}
                                        variant="tertiary"
                                        data-testid={copyButtonDataTest}
                                        size="small"
                                        textWrap={false}
                                        icon={isCopied ? 'check' : 'copy'}
                                    >
                                        <Translation
                                            id={
                                                isCopied
                                                    ? 'TR_COPIED_TO_CLIPBOARD'
                                                    : 'TR_COPY_TO_CLIPBOARD'
                                            }
                                        />
                                    </Button>
                                )}
                            </Column>
                        </Row>
                    </Card>
                    {areStepsVisible && (
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
                    )}
                </Column>
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
