import React from 'react';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import * as modalActions from '@suite-actions/modalActions';
import Wrapper from './components/Wrapper';

interface Props {
    onDismiss?: () => void;
}

const SafetyChecksBanner = (props: Props) => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });

    return (
        <Wrapper
            variant="warning"
            body={<Translation id="TR_SAFETY_CHECKS_DISABLED_WARNING" />}
            action={{
                label: <Translation id="TR_SAFETY_CHECKS_BANNER_CHANGE" />,
                onClick: () => openModal({ type: 'safety-checks' }),
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
