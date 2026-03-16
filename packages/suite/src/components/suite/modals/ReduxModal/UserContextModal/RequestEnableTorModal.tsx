import { useEffect } from 'react';

import { Translation } from '@suite/intl';
import { RequestEnableTorResponse } from '@suite-common/suite-config';
import { type UserContextPayload } from '@suite-common/suite-types';
import { Banner, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/selectors/suite/suiteSelectors';

type RequestEnableTorModalProps = {
    decision: Extract<UserContextPayload, { type: 'request-enable-tor' }>['decision'];
    onCancel: () => void;
};

export const RequestEnableTorModal = ({ onCancel, decision }: RequestEnableTorModalProps) => {
    const { isTorLoading, isTorEnabled } = useSelector(selectTorState);

    useEffect(() => {
        if (isTorEnabled) {
            decision.resolve(RequestEnableTorResponse.Skip);
            onCancel();
        }
    }, [isTorEnabled, decision, onCancel]);

    const onEnableTor = () => {
        decision.resolve(RequestEnableTorResponse.Continue);
        onCancel();
    };

    const onBackClick = () => {
        decision.resolve(RequestEnableTorResponse.Back);
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancel}
            onBackClick={onBackClick}
            heading={<Translation id="TR_TOR_ENABLE" />}
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={onEnableTor}
                        isLoading={isTorLoading}
                        isDisabled={isTorLoading}
                    >
                        {isTorLoading ? (
                            <Translation id="TR_ENABLING_TOR" />
                        ) : (
                            <Translation id="TR_TOR_ENABLE" />
                        )}
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Banner
                icon="torBrowser"
                intent="brand"
                margin={{ top: spacings.md }}
                description={
                    <Translation
                        id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                        values={{
                            b: chunks => <strong>{chunks}</strong>,
                        }}
                    />
                }
            />
        </Modal>
    );
};
