import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';

import * as signVerifyActions from '@wallet-actions/signVerifyActions';
import { AppState, Dispatch } from '@suite-types';
import SignVerify from './index';

const mapStateToProps = (state: AppState) => ({
    signVerify: state.wallet.signVerify,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    signVerifyActions: bindActionCreators(signVerifyActions, dispatch),
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SignVerify));
