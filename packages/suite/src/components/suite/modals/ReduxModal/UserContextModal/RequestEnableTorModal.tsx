import { useEffect } from 'react';

import { RequestEnableTorResponse } from '@suite-common/suite-config';
import { UserContextPayload } from '@suite-common/suite-types';
import { Banner, NewModal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';

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
        <NewModal
            onCancel={onCancel}
            onBackClick={onBackClick}
            heading={<Translation id="TR_TOR_ENABLE" />}
            size="small"
            bottomContent={
                <>
                    <NewModal.Button
                        onClick={onEnableTor}
                        isLoading={isTorLoading}
                        isDisabled={isTorLoading}
                    >
                        {isTorLoading ? (
                            <Translation id="TR_ENABLING_TOR" />
                        ) : (
                            <Translation id="TR_TOR_ENABLE" />
                        )}
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <Banner icon="tor" variant="primary" margin={{ top: spacings.md }}>
                <Translation
                    id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                    values={{
                        b: chunks => <strong>{chunks}</strong>,
                    }}
                />
            </Banner>
        </NewModal>
    );
};
