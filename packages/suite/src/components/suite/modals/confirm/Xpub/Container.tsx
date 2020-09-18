import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as notificationActions from '@suite-actions/notificationActions';
import { Dispatch } from '@suite-types';
import { Account } from '@wallet-types';
import Index from './index';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    addNotification: bindActionCreators(notificationActions.addToast, dispatch),
});

export type Props = {
    xpub: string;
    accountPath: string;
    accountIndex: number;
    accountType: Account['accountType'];
    symbol: Account['symbol'];
    accountLabel: Account['metadata']['accountLabel'];
    onCancel: () => void;
} & ReturnType<typeof mapDispatchToProps>;

export default connect(null, mapDispatchToProps)(Index);
