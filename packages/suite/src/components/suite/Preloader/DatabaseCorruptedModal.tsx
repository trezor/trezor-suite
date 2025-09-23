import React, { useState } from 'react';

import { Button, H3, Modal, Paragraph } from '@trezor/components';

import { resetSuiteAppThunk } from 'src/actions/suite/suiteThunks';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const DatabaseCorruptedModal = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
        setIsLoading(true);
        dispatch(resetSuiteAppThunk());
    };

    return (
        <Modal iconName="database" variant="destructive">
            <H3>
                <Translation id="TR_DATABASE_CORRUPTED" />
            </H3>
            <Paragraph variant="tertiary">
                <Button onClick={handleClick} isLoading={isLoading}>
                    <Translation id="TR_CLEAR_STORAGE" />
                </Button>
            </Paragraph>
        </Modal>
    );
};
