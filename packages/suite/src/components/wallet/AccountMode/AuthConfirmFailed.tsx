import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, colors } from '@trezor/components-v2';
import { NotificationCard, Translation } from '@suite-components';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import messages from '@suite/support/messages';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    authConfirm: bindActionCreators(suiteActions.authConfirm, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const AuthConfirmFailed = ({ locks, authConfirm }: Props) => {
    const progress = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <NotificationCard variant="warning">
            <Translation {...messages.TR_AUTH_CONFIRM_FAILED_TITLE} />
            <Button
                data-test="@passphrase-missmatch/retry-button"
                variant="tertiary"
                icon="REFRESH"
                color={colors.RED_ERROR}
                onClick={authConfirm}
                isLoading={progress}
            >
                <Translation {...messages.TR_AUTH_CONFIRM_FAILED_RETRY} />
            </Button>
        </NotificationCard>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthConfirmFailed);
