import { connect } from 'react-redux';

import { AppState } from '@suite-types';
import AdditionalFormEthereum from './index';

const mapStateToProps = (state: AppState) => ({
    send: state.wallet.send,
});

const mapDispatchToProps = () => ({});

export type StateProps = ReturnType<typeof mapStateToProps>;
export type DispatchProps = ReturnType<typeof mapDispatchToProps>;
export type Props = StateProps & DispatchProps;

export default connect(mapStateToProps, mapDispatchToProps)(AdditionalFormEthereum);
