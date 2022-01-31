import React from 'react';

import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import Wrapper from './components/Wrapper';
import { SettingsAnchor } from '@suite-constants/anchors';

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
                onClick: () =>
                    goto('settings-device', {
                        preserveParams: true,
                        anchor: SettingsAnchor.SafetyChecks,
                    }),
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
