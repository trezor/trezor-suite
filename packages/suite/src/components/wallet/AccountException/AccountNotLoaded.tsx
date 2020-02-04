import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';
import { colors, H2, Button } from '@trezor/components-v2';
import { resolveStaticPath } from '@suite-utils/nextjs';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { SUITE } from '@suite-actions/constants';
import { AppState, Dispatch } from '@suite-types';
import { Network, Discovery } from '@wallet-types';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: ${colors.BLACK0};
`;

// const Description = styled.div`
//     display: flex;
//     font-size: ${variables.FONT_SIZE.TINY};
//     text-align: center;
//     color: ${colors.BLACK50};
//     margin-bottom: 10px;
// `;

const Image = styled.img`
    width: 340px;
    height: 280px;
    margin-bottom: 40px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
`;

const ActionButton = styled(Button)`
    min-width: 160px;
`;

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    locked:
        state.suite.locks.includes(SUITE.LOCK_TYPE.DEVICE) ||
        state.suite.locks.includes(SUITE.LOCK_TYPE.UI),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    restart: bindActionCreators(discoveryActions.restart, dispatch),
});

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
 * @returns
 */
const AccountNotLoaded = (props: Props) => {
    const { locked, restart } = props;

    return (
        <Content>
            <Title>Discovery error</Title>
            <Image src={resolveStaticPath(`images/wallet/wallet-empty.svg`)} />
            <Actions>
                <ActionButton
                    variant="primary"
                    isLoading={locked}
                    disabled={locked}
                    onClick={restart}
                >
                    Retry
                </ActionButton>
            </Actions>
        </Content>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(AccountNotLoaded);
