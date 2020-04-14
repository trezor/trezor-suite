import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { AppState } from '@suite-types';
import SendIndex from './index';

const mapStateToProps = (state: AppState) => ({
    settings: state.wallet.settings,
    selectedAccount: state.wallet.selectedAccount,
    fiat: state.wallet.fiat,
});

const mapDispatchToProps = () => ({});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(SendIndex));
