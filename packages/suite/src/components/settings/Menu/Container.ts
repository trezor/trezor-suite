import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { injectIntl } from 'react-intl';
import * as routerActions from '@suite-actions/routerActions';
import * as modalActions from '@suite-actions/modalActions';

import { AppState, Dispatch } from '@suite-types';

import Component from './index';

const mapStateToProps = (state: AppState) => ({
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goto: bindActionCreators(routerActions.goto, dispatch),
    openModal: bindActionCreators(modalActions.openModal, dispatch),
});

export type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(Component));
