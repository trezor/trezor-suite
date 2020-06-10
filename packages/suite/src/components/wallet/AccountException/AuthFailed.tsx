import React from 'react';
import { Button } from '@trezor/components';
import * as suiteActions from '@suite-actions/suiteActions';
import { useDevice, useActions } from '@suite-hooks';
import { Translation, Image } from '@suite-components';

import Wrapper from './components/Wrapper';

const AuthFailed = () => {
    const { isLocked } = useDevice();
    const { authDevice } = useActions({
        authDevice: suiteActions.authorizeDevice,
    });
    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC" />}
            image={<Image image="UNI_ERROR" />}
        >
            <Button variant="primary" icon="PLUS" isLoading={isLocked()} onClick={authDevice}>
                <Translation id="TR_RETRY" />
            </Button>
        </Wrapper>
    );
};

export default AuthFailed;
