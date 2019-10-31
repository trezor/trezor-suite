import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl, WrappedComponentProps } from 'react-intl';

import { Notification } from '@trezor/components';
import { acquireDevice } from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import SuiteLayout from '@suite-components/SuiteLayout';
import { AppState } from '@suite-types';
import l10nMessages from './index.messages';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    locks: state.suite.locks,
});

type Props = ReturnType<typeof mapStateToProps> & {
    acquireDevice: typeof acquireDevice;
} & WrappedComponentProps;

const Acquire = (props: Props) => {
    const { device, locks } = props;
    if (!device) return null;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <SuiteLayout showSuiteHeader>
            <Notification
                title={props.intl.formatMessage(l10nMessages.TR_DEVICE_USED_IN_OTHER)}
                message={props.intl.formatMessage(l10nMessages.TR_USE_YOUR_DEVICE_IN_THIS_WINDOW)}
                variant="info"
                cancelable={false}
                isActionInProgress={locked}
                actions={[
                    {
                        label: props.intl.formatMessage(l10nMessages.TR_ACQUIRE_DEVICE),
                        callback: props.acquireDevice,
                    },
                ]}
            />
        </SuiteLayout>
    );
};

export default injectIntl(
    connect(
        mapStateToProps,
        dispatch => ({
            acquireDevice: bindActionCreators(acquireDevice, dispatch),
        }),
    )(Acquire),
);
