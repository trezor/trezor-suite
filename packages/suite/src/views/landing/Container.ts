import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as routerActions from '@suite-actions/routerActions';
import { Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    initialRedirection: bindActionCreators(routerActions.initialRedirection, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
