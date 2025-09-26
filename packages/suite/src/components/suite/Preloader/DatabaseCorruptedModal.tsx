import React, { useState } from 'react';

import { H3, Modal } from '@trezor/components';

import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';
import { Translation } from 'src/components/suite/Translation';
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
            variant="destructive"
            bottomContent={
                <Modal.Button onClick={handleClick} isLoading={isLoading} variant="primary">
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
