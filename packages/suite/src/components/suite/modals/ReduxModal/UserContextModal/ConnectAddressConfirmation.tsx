import { useEffect } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    connectPopupActions,
    connectPopupVerifyAddressThunk,
    getPermissionDeferred,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { Badge, Button, Card, Column, H3, Icon, Modal, Paragraph, Row } from '@trezor/components';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import { DeviceModelInternal } from '@trezor/device-utils';
import { ConfirmOnDevicePill, mapTrezorModelToIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { WalletLabeling } from 'src/components/suite/labeling';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const ConnectAddressConfirmation = () => {
    const { device } = useDevice();
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const onVerify = (index: number) => {
        dispatch(connectPopupVerifyAddressThunk({ index }));
    };
    const onConfirm = () => {
        getPermissionDeferred()?.resolve();
    };
    const onFinish = () => {
        if (popupCall?.state === 'address-confirmation' && !popupCall?.exported) {
            getPermissionDeferred()?.reject(TypedError('Method_Cancel'));
        }
        dispatch(connectPopupActions.finishCall());
    };
    const isLoading =
        popupCall?.state === 'address-confirmation' &&
        popupCall?.addresses.some(address => address.loading);

    useEffect(() => {
        // Automatically verify addresses that have showOnDevice enabled and are not already verified
        if (!popupCall || popupCall?.state !== 'address-confirmation' || !popupCall.exported)
            return;
        const addressToVerify = popupCall?.addresses.findIndex(
            address =>
                address.validatePayload.showOnTrezor &&
                address.validated === 'not-started' &&
                !address.loading,
        );
        if (!isLoading && addressToVerify >= 0) {
            dispatch(
                connectPopupVerifyAddressThunk({
                    index: addressToVerify,
                }),
            );
        }
    }, [popupCall, isLoading, dispatch]);

    if (!popupCall || popupCall?.state !== 'address-confirmation') return null;

    const isPublicKeyMethod =
        popupCall?.method === 'getPublicKey' || popupCall?.method.endsWith('GetPublicKey');

    return (
        <ConnectModalBackdrop onClick={onFinish} canSwitchDevice={!popupCall.exported}>
            <ConfirmOnDevicePill
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                isConfirmed={!isLoading}
            />
            <Modal.ModalBase
                intent="brand"
                bottomContent={
                    <>
                        {!popupCall.exported && (
                            <Modal.Button
                                onClick={onConfirm}
                                size="medium"
                                data-testid="@connect-address-confirmation/confirm-button"
                            >
                                <Translation id="TR_CONFIRM" />
                            </Modal.Button>
                        )}
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={onFinish}
                            size="medium"
                            data-testid="@connect-address-confirmation/close-button"
                            isDisabled={isLoading}
                        >
                            <Translation id={popupCall.exported ? 'TR_CLOSE' : 'TR_CANCEL'} />
                        </Modal.Button>
                    </>
                }
            >
                <Column gap={spacings.xs}>
                    {popupCall.exported ? (
                        <Row alignItems="center" gap={spacings.sm}>
                            <Icon name="checkCircle" size={32} intent="brand" />
                            <H3 intent="brand">
                                <Translation id="TR_CONNECT_ADDRESS_CONFIRMATION_SUCCESS" />
                            </H3>
                        </Row>
                    ) : (
                        <H3>
                            <Translation id="TR_CONNECT_EXPORT_ACCOUNTS" />
                        </H3>
                    )}
                    <ConnectCallSource />
                    <Paragraph>
                        <Translation
                            id={
                                popupCall.exported
                                    ? 'TR_CONNECT_ADDRESS_CONFIRMATION_DESCRIPTION'
                                    : 'TR_CONNECT_EXPORT_ACCOUNTS_DESCRIPTION'
                            }
                            values={{
                                thirdParty: (
                                    <b>
                                        {popupCall.source.manifest?.appName ??
                                            popupCall.source.origin}
                                    </b>
                                ),
                                passphraseWalletLabel: device && (
                                    <b>
                                        <WalletLabeling device={device} />
                                    </b>
                                ),
                                deviceLabel: <b>{deviceLabel}</b>,
                            }}
                        />
                    </Paragraph>

                    <Card
                        header={
                            isPublicKeyMethod ? (
                                <Translation id="TR_PUBLIC_KEYS" />
                            ) : (
                                <Translation id="TR_ADDRESSES" />
                            )
                        }
                        margin={{ top: spacings.md }}
                    >
                        <Column gap={spacings.sm}>
                            {popupCall?.addresses.map((address, index) => (
                                <Row
                                    key={index}
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={spacings.sm}
                                >
                                    <Row gap={spacings.sm} alignItems="center" flex="1">
                                        <Paragraph overflowWrap="break-word">
                                            {address.address}
                                        </Paragraph>
                                        {address.validated === 'valid' && (
                                            <Badge
                                                intent="brand"
                                                iconLeft="check"
                                                size="small"
                                                data-testid={`@connect-address-confirmation/verified-badge/${index}`}
                                            >
                                                <Translation id="TR_VERIFIED" />
                                            </Badge>
                                        )}
                                        {address.validated === 'failed' && (
                                            <Badge
                                                intent="warning"
                                                iconLeft="warning"
                                                size="small"
                                                data-testid={`@connect-address-confirmation/error-badge/${index}`}
                                            >
                                                <Translation id="TR_VERIFICATION_CANCELED" />
                                            </Badge>
                                        )}
                                    </Row>
                                    <Button
                                        data-testid={`@connect-address-confirmation/verify-button/${index}`}
                                        intent="neutral"
                                        priority="secondary"
                                        onClick={() => onVerify(index)}
                                        iconLeft={
                                            mapTrezorModelToIcon[
                                                device?.features?.internal_model ||
                                                    DeviceModelInternal.UNKNOWN
                                            ]
                                        }
                                        size="small"
                                        isLoading={address.loading}
                                        isDisabled={isLoading}
                                    >
                                        {address.loading ? (
                                            <Translation id="TR_VERIFYING" />
                                        ) : (
                                            <Translation id="TR_VERIFY" />
                                        )}
                                    </Button>
                                </Row>
                            ))}
                        </Column>
                    </Card>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
