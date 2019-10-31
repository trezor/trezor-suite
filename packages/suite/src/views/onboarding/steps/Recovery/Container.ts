import { connect } from 'react-redux';

import { AppState } from '@suite-types';

import Step from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

export type Props = ReturnType<typeof mapStateToProps>;

export default connect(
    mapStateToProps,
    () => {},
)(Step);
