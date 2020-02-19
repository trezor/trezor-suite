import { connect } from 'react-redux';

import { AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    discreetMode: state.wallet.settings.discreetMode,
});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type Props = StateProps;

export default connect(mapStateToProps)(Component);
