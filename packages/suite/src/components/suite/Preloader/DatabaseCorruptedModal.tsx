import React, { useState } from 'react';

import { Translation } from '@suite/intl';
import { H3, Modal } from '@trezor/components';

import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';
import { useDispatch } from 'src/hooks/suite';

export const DatabaseCorruptedModal = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        setIsLoading(true);
        dispatch(resetSuiteAppThunk());
    };

    return (
        <Modal
            iconName="database"
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
        </Modal>
    );
};
