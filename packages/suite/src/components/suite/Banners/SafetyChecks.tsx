import React from 'react';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import Wrapper from './components/Wrapper';
import * as routerActions from '@suite/actions/suite/routerActions';

interface Props {
    onDismiss?: () => void;
}

const SafetyChecksBanner = (props: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Wrapper
            variant="warning"
            body={<Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />}
            action={{
                label: <Translation id="TR_SAFETY_CHECKS_BANNER_CHANGE" />,
                // TODO: Use anchor to bring the user to the appropriate section of settings.
                onClick: () => goto('settings-device'),
                'data-test': '@banner/safety-checks/button',
            }}
            dismissal={
                (props.onDismiss !== undefined && {
                    onClick: props.onDismiss,
                    'data-test': '@banner/safety-checks/dismiss',
                }) ||
                undefined
            }
        />
    );
};

export default SafetyChecksBanner;
