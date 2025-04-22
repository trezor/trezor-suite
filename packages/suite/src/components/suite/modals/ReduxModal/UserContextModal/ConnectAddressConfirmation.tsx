import { useEffect } from 'react';

import {
    connectPopupActions,
    connectPopupVerifyAddressThunk,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { Badge, Button, Card, Column, H3, Icon, Modal, Paragraph, Row } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { ConfirmOnDevice, mapTrezorModelToIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';

export const ConnectAddressConfirmation = () => {
    const { device } = useDevice();
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const onVerify = (index: number) => {
        dispatch(connectPopupVerifyAddressThunk({ index }));
    };
    const onFinish = () => {
        dispatch(connectPopupActions.finishCall());
    };
    const isLoading =
        popupCall?.state === 'address-confirmation' &&
        popupCall?.addresses.some(address => address.loading);

    useEffect(() => {
        // Automatically verify addresses that have showOnDevice enabled and are not already verified
        if (!popupCall || popupCall?.state !== 'address-confirmation') return;
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

    return (
        <Modal.Backdrop>
            <ConfirmOnDevice
                title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                deviceModelInternal={device?.features?.internal_model}
                deviceUnitColor={device?.features?.unit_color}
                isConfirmed={!isLoading}
            />
            <Modal.ModalBase
                variant="primary"
                bottomContent={
                    <>
                        <Modal.Button
                            variant="tertiary"
                            onClick={onFinish}
                            size="medium"
                            data-testid="@connect-address-confirmation/close-button"
                        >
                            <Translation id="TR_DONE" />
                        </Modal.Button>
                    </>
                }
            >
                <Column gap={spacings.xs}>
                    <Row alignItems="center" gap={spacings.sm}>
                        <Icon name="checkCircle" size={32} variant="primary" />
                        <H3 variant="primary">
                            <Translation id="TR_CONNECT_ADDRESS_CONFIRMATION_SUCCESS" />
                        </H3>
                    </Row>
                    <Paragraph>
                        <Translation id="TR_CONNECT_ADDRESS_CONFIRMATION_DESCRIPTION" />
                    </Paragraph>

                    <Card heading={<Translation id="TR_ADDRESSES" />} margin={{ top: spacings.md }}>
                        <Column gap={spacings.sm}>
                            {popupCall?.addresses.map((address, index) => (
                                <Row
                                    key={index}
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={spacings.sm}
                                >
                                    <Row gap={spacings.sm} alignItems="center" flex="1">
                                        <Paragraph wordBreak="break-all">
                                            {address.address}
                                        </Paragraph>
                                        {address.validated === 'valid' && (
                                            <Badge
                                                variant="primary"
                                                icon="check"
                                                size="small"
                                                data-testid={`@connect-address-confirmation/verified-badge/${index}`}
                                            >
                                                <Translation id="TR_VERIFIED" />
                                            </Badge>
                                        )}
                                        {address.validated === 'failed' && (
                                            <Badge variant="warning" icon="warning" size="small">
                                                <Translation id="TR_ERROR" />
                                            </Badge>
                                        )}
                                    </Row>
                                    <Button
                                        data-testid={`@connect-address-confirmation/verify-button/${index}`}
                                        variant="tertiary"
                                        onClick={() => onVerify(index)}
                                        icon={
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
        </Modal.Backdrop>
    );
};
