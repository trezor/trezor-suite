import { useState } from 'react';

import { thpActions } from '@suite-common/thp';
import { acquireDevice } from '@suite-common/wallet-core';
import { Column, Modal, Paragraph } from '@trezor/components';

import { ThpPairingCodeEntry } from './ThpPairingCodeEntry';
import { useDevice, useDispatch, useSelector } from '../../../hooks/suite';
import { Translation } from '../../suite/Translation';

export const ThpPairingFailedModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { device } = useDevice();
    const dispatch = useDispatch();
    const lastThpCode = useSelector(state => state.thp.lastThpCode);

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
            size="small"
            bottomContent={
                <>
                    <Modal.Button onClick={handleRetry} isLoading={isLoading} variant="destructive">
                        <Translation id="TR_THP_GET_NEW_CODE" />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} variant="tertiary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Column gap={16} margin={{ top: 16 }}>
                <ThpPairingCodeEntry disabled lastCode={lastThpCode} />
                <Paragraph variant="destructive">
                    <Translation id="TR_THP_INCORRECT_SECURITY_CODE" />
                </Paragraph>
            </Column>
        </Modal>
    );
};
