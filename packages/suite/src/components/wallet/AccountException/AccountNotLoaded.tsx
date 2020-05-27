import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Button } from '@trezor/components';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types';
import { Network, Discovery } from '@wallet-types';
import { Translation, Image } from '@suite-components';

import Wrapper from './components/Wrapper';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    locks: state.suite.locks,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            restart: discoveryActions.restart,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        network: Network;
        discovery: Discovery;
    };
/**
 * Handler for 'bundle-exception' in discovery
 * Account couldn't be loaded for multiple reasons:
 * - Discovery throws bundle-exception with code or runtime error
 * - Other trezor-connect runtime error
 */
const AccountNotLoaded = (props: Props) => {
    const { locks, restart } = props;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    // check device unsupported capabilities
    // const failed = props.discovery.failed.find(f => f.symbol === network.symbol);
    // const cap = device?.unavailableCapabilities[network.symbol];
    // console.warn("CAP!", cap, device?.unavailableCapabilities, failed)
    // if (device?.features && device.unavailableCapabilities)

    return (
        <Wrapper
            title={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_ERROR" />}
            description={<Translation id="TR_ACCOUNT_EXCEPTION_DISCOVERY_DESCRIPTION" />}
            image={<Image image="EMPTY_WALLET" />}
        >
            <Button variant="primary" icon="PLUS" isLoading={locked} onClick={restart}>
                <Translation id="TR_RETRY" />
            </Button>
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AccountNotLoaded);
