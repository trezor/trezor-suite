import { useEffect } from 'react';

import {
    connectPopupActions,
    connectPopupVerifyAddressThunk,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import {
    Badge,
    Button,
    Card,
    Column,
    H3,
    Icon,
    NewModal,
    Paragraph,
    Row,
} from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';
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

    useEffect(() => {
        // Automatically verify addresses that have showOnDevice enabled and are not already verified
        if (!popupCall || popupCall?.state !== 'address-confirmation') return;
        const isLoading = popupCall?.addresses.some(address => address.loading);
        const addressToVerify = popupCall?.addresses.findIndex(
            address =>
                address.validatePayload.showOnTrezor && !address.validated && !address.loading,
        );
        if (!isLoading && addressToVerify >= 0) {
            dispatch(
                connectPopupVerifyAddressThunk({
                    index: addressToVerify,
                }),
            );
        }
    }, [popupCall, dispatch]);

    if (!popupCall || popupCall?.state !== 'address-confirmation') return null;

    return (
        <NewModal
            variant="primary"
            bottomContent={
                <>
                    <NewModal.Button variant="tertiary" onClick={onFinish} size="medium">
                        <Translation id="TR_DONE" />
                    </NewModal.Button>
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
                                    <Paragraph wordBreak="break-all">{address.address}</Paragraph>
                                    {address.validated && (
                                        <Badge variant="primary" icon="check" size="small">
                                            <Translation id="TR_VERIFIED" />
                                        </Badge>
                                    )}
                                </Row>
                                <Button
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
        </NewModal>
    );
};
