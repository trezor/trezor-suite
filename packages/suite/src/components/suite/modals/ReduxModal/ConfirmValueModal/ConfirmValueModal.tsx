import { ReactNode, useEffect } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import { selectSelectedDevice, selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    Banner,
    Card,
    Column,
    Link,
    NewModal,
    NewModalProps,
    Paragraph,
    Row,
    Tooltip,
} from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { ConfirmOnDevice } from '@trezor/product-components';
import { palette, spacings } from '@trezor/theme';

import { MODAL } from 'src/actions/suite/constants';
import { Translation } from 'src/components/suite';
import { QrCode } from 'src/components/suite/QrCode';
import { useGuideOpenNode } from 'src/hooks/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { ThunkAction } from 'src/types/suite';
import { DESTINATION_TAG_GUIDE_PATH } from 'src/views/wallet/send/Options/RippleOptions/DestinationTag';

import {
    OutputElementLine,
    TransactionReviewOutputElement,
} from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputElement';

export interface ConfirmValueModalProps
    extends Pick<NewModalProps, 'onCancel' | 'heading' | 'description'> {
    account: Account;
    copyButtonText: ReactNode;
    stepLabel: ReactNode;
    'data-testid'?: string;
    isConfirmed?: boolean;
    validateOnDevice: () => ThunkAction;
    value: string;
}

export const ConfirmValueModal = ({
    account,
    copyButtonText,
    'data-testid': copyButtonDataTest,
    stepLabel,
    heading,
    description,
    isConfirmed,
    onCancel,
    validateOnDevice,
    value,
}: ConfirmValueModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const modalContext = useSelector(state => state.modal.context);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const dispatch = useDispatch();
    const { openNodeById } = useGuideOpenNode();

    const canConfirmOnDevice = !!(device?.connected && device?.available);
    const addressConfirmed = isConfirmed || !canConfirmOnDevice;
    const isCancelable = isActionAbortable || addressConfirmed;
    const state = addressConfirmed ? 'confirmed' : 'active';
    const outputLines: OutputElementLine[] = [
        {
            id: 'address',
            value,
            type: 'safe-address',
        },
    ];

    const copy = () => {
        const result = copyToClipboard(value);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    const buttonTooltipContent = () => {
        if (!addressConfirmed) {
            return <Translation id="TR_CONFIRM_BEFORE_COPY" />;
        }

        return null;
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

    // QR code needs constant colors, not light/dark theme colors
    const qrCodeFgColor = addressConfirmed ? palette.lightGray1000 : palette.lightGray700;

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
                description={description}
                onCancel={isCancelable ? onCancel : undefined}
                size="huge"
            >
                <Column gap={spacings.xl}>
                    {!device?.connected && (
                        <Banner icon="warningTriangle" variant="warning">
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
                    {account.networkType === 'ripple' && (
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
                    <Row gap={spacings.xl} alignItems="stretch">
                        <Card flex="1" paddingType="small">
                            <QrCode
                                value={value}
                                bgColor="transparent"
                                fgColor={qrCodeFgColor}
                                showMessage={!addressConfirmed}
                            />
                        </Card>
                        <Column flex="2" justifyContent="space-between" gap={spacings.lg}>
                            <TransactionReviewOutputElement
                                title={stepLabel}
                                lines={outputLines}
                                state={state}
                                account={account}
                            />
                            <Tooltip content={buttonTooltipContent()}>
                                <NewModal.Button
                                    isDisabled={!addressConfirmed}
                                    onClick={copy}
                                    data-testid={copyButtonDataTest}
                                >
                                    {copyButtonText}
                                </NewModal.Button>
                            </Tooltip>
                        </Column>
                    </Row>
                </Column>
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
