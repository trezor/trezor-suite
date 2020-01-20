import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Notification } from '@suite-components';
import { Translation } from '@suite-components/Translation';
import * as suiteActions from '@suite-actions/suiteActions';
import messages from '@suite/support/messages';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    retryAuthConfirm: bindActionCreators(suiteActions.retryAuthConfirm, dispatch),
});

export type Props = ReturnType<typeof mapDispatchToProps>;

const AuthConfirm = ({ retryAuthConfirm }: Props) => {
    return (
        <Notification
            variant="error"
            title={<Translation {...messages.TR_AUTH_CONFIRM_FAILED_TITLE} />}
            message={<Translation {...messages.TR_AUTH_CONFIRM_FAILED_MESSAGE} />}
            actions={[
                {
                    label: <Translation {...messages.TR_AUTH_CONFIRM_FAILED_RETRY} />,
                    callback: retryAuthConfirm,
                },
            ]}
        />
    );
};

export default connect(null, mapDispatchToProps)(AuthConfirm);
