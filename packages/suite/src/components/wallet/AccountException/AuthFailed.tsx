import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types';
import { Translation } from '@suite-components';
import messages from '@suite/support/messages';
import Wrapper from './components/Wrapper';

const mapStateToProps = (state: AppState) => ({
    locks: state.suite.locks,
    toast: state.notifications.find(n => n.type === 'auth-failed'),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    authDevice: bindActionCreators(suiteActions.authorizeDevice, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const AuthFailed = ({ locks, authDevice }: Props) => {
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <Wrapper
            title={<Translation {...messages.TR_ACCOUNT_EXCEPTION_AUTH_ERROR} />}
            description="TODO: Error generic text"
            image={resolveStaticPath(`images/suite/uni-error.svg`)}
        >
            <Button variant="primary" icon="PLUS" isLoading={locked} onClick={authDevice}>
                <Translation {...messages.TR_RETRY} />
            </Button>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthFailed);
