import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsTorEnabled, selectIsTorLoading } from '@suite/tor';
import { RequestEnableTorResponse } from '@suite-common/suite-config';
import { Banner, Modal } from '@trezor/components';
import { TorBrowserIcon } from '@trezor/icons';

type RequestEnableTorModalProps = {
    decision: { resolve: (value: RequestEnableTorResponse) => void };
    onCancel: () => void;
};

export const RequestEnableTorModal = ({ onCancel, decision }: RequestEnableTorModalProps) => {
    const isTorLoading = useSelector(selectIsTorLoading);
    const isTorEnabled = useSelector(selectIsTorEnabled);

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
                icon={TorBrowserIcon}
                intent="brand"
                margin={{ top: 16 }}
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
