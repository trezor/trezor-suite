import React from 'react';
import { colors, variables, Loader } from '@trezor/components';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import Row from './Row';

import ProgressBar from './ProgressBar';

const Wrapper = styled.div``;

const LoadingWrapper = styled.div`
    display: flex;
    padding-top: 10px;
    justify-content: flex-start;
    align-items: center;
    padding-left: 20px;
`;

const LoadingText = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    padding-left: 10px;
`;

interface Props {
    suite: AppState['suite'];
    wallet: AppState['wallet'];
    router: AppState['router'];
    discovery: AppState['wallet']['discovery'];
}

const getLoadingProgress = (discovery: AppState['wallet']['discovery']) => {
    const d = discovery[0];
    if (d && d.loaded && d.total) {
        return Math.round((d.loaded / d.total) * 100);
    }
    return 0;
};

const Menu = (props: Props) => (
    <Wrapper>
        <ProgressBar progress={getLoadingProgress(props.discovery)} />
        {props.wallet.accounts.length === 0 && ( // TODO check discovery progress not accounts
            <LoadingWrapper>
                <Loader size={15} />
                <LoadingText>Loading accounts</LoadingText>
            </LoadingWrapper>
        )}
        {props.wallet.accounts
            .filter(account => !account.empty)
            .map(account => (
                <Row account={account} />
            ))}
    </Wrapper>
);

const mapStateToProps = (state: AppState) => ({
    wallet: state.wallet,
    suite: state.suite,
    router: state.router,
    discovery: state.wallet.discovery,
});

export default connect(mapStateToProps)(Menu);
