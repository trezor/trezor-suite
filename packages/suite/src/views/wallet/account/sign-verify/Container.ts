import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';

import signVerifyActions from '@wallet-actions/signVerifyActions';
import { AppState, Dispatch } from '@suite-types/index';
import SignVerify from './index';

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    router: state.router,
    signVerify: state.wallet.signVerify,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    signVerifyActions: bindActionCreators(signVerifyActions, dispatch),
});

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(SignVerify),
);
