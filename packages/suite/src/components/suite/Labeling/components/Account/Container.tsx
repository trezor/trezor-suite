import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    devices: state.devices,
});

export type Props = ReturnType<typeof mapStateToProps> & {
    account: Account | Account[];
};

export default connect(mapStateToProps)(Component);
