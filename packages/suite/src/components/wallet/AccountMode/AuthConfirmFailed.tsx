import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, colors } from '@trezor/components';
import { NotificationCard, Translation } from '@suite-components';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';

import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            authConfirm: suiteActions.authConfirm,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const AuthConfirmFailed = ({ locks, authConfirm }: Props) => {
    const progress = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <NotificationCard variant="warning">
            <Translation id="TR_AUTH_CONFIRM_FAILED_TITLE" />
            <Button
                data-test="@passphrase-mismatch/retry-button"
                variant="tertiary"
                icon="REFRESH"
                color={colors.RED_ERROR}
                onClick={authConfirm}
                isLoading={progress}
            >
                <Translation id="TR_AUTH_CONFIRM_FAILED_RETRY" />
            </Button>
        </NotificationCard>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthConfirmFailed);
