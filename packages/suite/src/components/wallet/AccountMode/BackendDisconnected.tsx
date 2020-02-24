import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button, colors } from '@trezor/components';
import { NotificationCard, Translation } from '@suite-components';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import messages from '@suite/support/messages';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    selectedAccount: state.wallet.selectedAccount,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    reconnect: bindActionCreators(blockchainActions.reconnect, dispatch),
});

export type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const Disconnected = ({ selectedAccount, reconnect }: Props) => {
    // TODO: auto reconnection
    const [progress, setProgress] = useState(false);
    if (selectedAccount.status !== 'loaded') return null;
    const { network } = selectedAccount;
    const click = async () => {
        setProgress(true);
        const r: any = await reconnect(network.symbol);
        if (!r.success) {
            setProgress(false);
        }
    };

    return (
        <NotificationCard variant="warning">
            <Translation {...messages.TR_BACKEND_DISCONNECTED} />
            <Button
                variant="tertiary"
                icon="REFRESH"
                color={colors.RED_ERROR}
                onClick={click}
                isLoading={progress}
            >
                <Translation {...messages.TR_BACKEND_CONNECT} />
            </Button>
        </NotificationCard>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Disconnected);
