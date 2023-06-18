import React from 'react';

import { Translation } from 'src/components/suite';
import { useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { Banner } from './Banner';
import { SettingsAnchor } from 'src/constants/suite/anchors';

interface Props {
    onDismiss?: () => void;
}

const SafetyChecksBanner = (props: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    return (
        <Banner
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
