import React, { useState } from 'react';

import { Translation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { H3, Modal, Paragraph } from '@trezor/components';
import { DatabaseIcon } from '@trezor/icons';

import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';

type DatabaseCorruptedModalProps = {
    error: unknown;
};

export const DatabaseCorruptedModal = ({ error }: DatabaseCorruptedModalProps) => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        setIsLoading(true);
        dispatch(resetSuiteAppThunk());
    };

    return (
        <Modal
            icon={DatabaseIcon}
            intent="critical"
            bottomContent={
                <Modal.Button onClick={handleClick} isLoading={isLoading} intent="brand">
                    <Translation id="TR_CLEAR_STORAGE" />
                </Modal.Button>
            }
        >
            <H3>
                <Translation id="TR_DATABASE_CORRUPTED" />
            </H3>
            <Paragraph>
                Suite could not load its database. If another Suite instance is using the same
                profile, close it and restart this instance before trying to clear storage.
            </Paragraph>
            {typeof error === 'string' && <Paragraph>{error}</Paragraph>}
        </Modal>
    );
};
