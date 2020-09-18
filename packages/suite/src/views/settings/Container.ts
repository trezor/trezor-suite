import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';
import * as storageActions from '@suite-actions/storageActions';
import * as languageActions from '@settings-actions/languageActions';
import * as routerActions from '@suite-actions/routerActions';
import * as metadataActions from '@suite-actions/metadataActions';
import { AppState, Dispatch } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    language: state.suite.settings.language,
    localCurrency: state.wallet.settings.localCurrency,
    metadata: state.metadata,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            setLocalCurrency: walletSettingsActions.setLocalCurrency,
            removeDatabase: storageActions.removeDatabase,
            fetchLocale: languageActions.fetchLocale,
            goto: routerActions.goto,
            initMetadata: metadataActions.init,
            disableMetadata: metadataActions.disableMetadata,
            disconnectProvider: metadataActions.disconnectProvider,
        },
        dispatch,
    );

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default connect(mapStateToProps, mapDispatchToProps)(Component);
