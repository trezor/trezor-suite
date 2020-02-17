import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    suite: state.suite,
    layoutSize: state.resize.size,
});

type ContainerProps = ReturnType<typeof mapStateToProps>;

export interface Props extends ContainerProps {
    children?: React.ReactNode;
    title?: string;
    secondaryMenu?: React.ReactNode;
}

export default connect(mapStateToProps)(Component);
