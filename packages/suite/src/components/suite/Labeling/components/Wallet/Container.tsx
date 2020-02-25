import { connect } from 'react-redux';
import { TrezorDevice, AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    labeling: state.labeling,
});

export type Props = ReturnType<typeof mapStateToProps> & {
    device: TrezorDevice;
    useDeviceLabel: boolean;
};

export default connect(mapStateToProps)(Component);
