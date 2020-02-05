import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { colors } from '@trezor/components-v2';
import { DISCOVERY } from '@wallet-actions/constants';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Discovery } from '@wallet-types';
import { AppState, Dispatch } from '@suite-types';

const Wrapper = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 2px;
    z-index: 1;
    background: ${colors.WHITE};
    overflow: hidden;
`;

const Line = styled.div<{ progress: number }>`
    height: 2px;
    display: flex;
    background: ${colors.GREEN};
    width: ${props => props.progress}%;
    transition: 1s width;
`;

const mapStateToProps = (state: AppState) => ({
    discovery: state.wallet.discovery,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    getDiscoveryForDevice: () => dispatch(discoveryActions.getDiscoveryForDevice()),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const calculateProgress = (discovery: Discovery) => {
    if (discovery.loaded && discovery.total) {
        return Math.round((discovery.loaded / discovery.total) * 100);
    }
    return 0;
};

const ProgressBar = (props: Props) => {
    const discovery = props.getDiscoveryForDevice();
    if (!discovery || discovery.status >= DISCOVERY.STATUS.STOPPING) return null;
    return (
        <Wrapper>
            <Line progress={calculateProgress(discovery)} />
        </Wrapper>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(ProgressBar);
