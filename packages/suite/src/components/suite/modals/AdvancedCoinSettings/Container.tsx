import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { addBlockbookUrl, removeBlockbookUrl } from '@settings-actions/walletSettingsActions';
import { AppState, Dispatch } from '@suite-types';
import { Network } from '@suite/types/wallet';
import Index from './index';

const mapStateToProps = (state: AppState) => ({
    blockbookUrls: state.wallet.settings.blockbookUrls,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            addBlockbookUrl,
            removeBlockbookUrl,
        },
        dispatch,
    );

export type Props = {
    coin: Network['symbol'];
    onCancel: () => void;
} & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Index);
