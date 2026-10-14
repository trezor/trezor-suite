import React, { useState } from 'react';

import { Translation } from '@suite/intl';
import { H3, Modal } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { DatabaseIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';

export const DatabaseCorruptedModal = () => {
    const { dispatch } = useServices(injectDispatch);
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
        </Modal>
    );
};
