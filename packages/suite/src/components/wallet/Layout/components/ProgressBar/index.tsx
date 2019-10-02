import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { colors } from '@trezor/components';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { Discovery } from '@wallet-types';
import { AppState, Dispatch } from '@suite-types';

const Wrapper = styled.div`
    position: absolute;
    width: 100%;
    z-index: 1;
`;

const Line = styled.div<{ progress: number }>`
    height: 1px;
    display: flex;
    background: ${colors.GREEN_PRIMARY};
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
    if (!discovery || discovery.status >= 4) return null;
    return (
        <Wrapper>
            <Line progress={calculateProgress(discovery)} />
        </Wrapper>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ProgressBar);
