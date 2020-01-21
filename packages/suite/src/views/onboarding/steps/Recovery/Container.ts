import { connect } from 'react-redux';

import { AppState, InjectedModalApplicationProps } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

export type Props = ReturnType<typeof mapStateToProps> & InjectedModalApplicationProps;

export default connect(mapStateToProps, null)(Step);
