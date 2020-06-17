import { connect } from 'react-redux';
import SignVerify from './index';
import { AppState } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
});

export type StateProps = ReturnType<typeof mapStateToProps>;

export interface ChildProps {
    account: NonNullable<StateProps['selectedAccount']['account']>;
    isLocked: () => boolean;
}

export default connect(mapStateToProps)(SignVerify);
