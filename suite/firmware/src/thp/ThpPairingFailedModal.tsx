import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { thpActions } from '@suite-common/thp';
import { acquireDevice, selectSelectedFirstThpDevice } from '@suite-common/wallet-core';
import { Column, Modal, Paragraph } from '@trezor/components';

import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';

export const ThpPairingFailedModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const device = useSelector(selectSelectedFirstThpDevice);
    const dispatch = useDispatch();
    const lastThpCode = useSelector(
        (state: { thp: { lastThpCode?: string } }) => state.thp.lastThpCode,
    );

    const handleRetry = () => {
        setIsLoading(true);
        // Re-try is simply acquiring the device again which triggers the THP flow
        dispatch(acquireDevice({ requestedDevice: device }));
    };

    const onCancel = () => {
        dispatch(thpActions.finishThpFlow());
    };

    return (
        <Modal
            heading={<Translation id="TR_THP_ENTER_ONE_TIME_CODE" />}
            description={<Translation id="TR_THP_CHECK_TREZOR_FOR_CODE" />}
            data-testid="@modal/thp-paring-failed"
            width={600}
            bottomContent={
                <>
                    <Modal.Button onClick={handleRetry} isLoading={isLoading} intent="critical">
                        <Translation id="TR_THP_GET_NEW_CODE" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={16} margin={{ top: 16 }}>
                <ThpPairingCodeEntry disabled lastCode={lastThpCode} />
                <Paragraph intent="critical">
                    <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
