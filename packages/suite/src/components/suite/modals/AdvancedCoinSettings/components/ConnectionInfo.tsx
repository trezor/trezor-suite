import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { Blockchain } from '@suite/reducers/wallet/blockchainReducer';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
    margin-top: 12px;
`;

const Heading = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    line-height: 1.5;
`;

const Info = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    line-height: 1.57;
    /* margin-bottom: 14px; */
`;

interface Props {
    blockchain: Blockchain;
}

const ConnectionInfo = ({ blockchain }: Props) => (
    <Wrapper>
        <Heading>
            <Translation id="SETTINGS_ADV_COIN_CONN_INFO_TITLE" />
        </Heading>
        {blockchain.connected ? (
            <>
                <Info>
                    <Translation
                        id="SETTINGS_ADV_COIN_CONN_INFO_URL"
                        values={{
                            url: blockchain.url,
                        }}
                    />
                </Info>
                <Info>
                    <Translation
                        id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HASH"
                        values={{
                            hash: blockchain.blockHash,
                        }}
                    />
                </Info>
                <Info>
                    <Translation
                        id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HEIGHT"
                        values={{
                            height: blockchain.blockHeight,
                        }}
                    />
                </Info>
                <Info>
                    <Translation
                        id="SETTINGS_ADV_COIN_CONN_INFO_VERSION"
                        values={{
                            version: blockchain.version,
                        }}
                    />
                </Info>
            </>
        ) : (
            <Info>
                <Translation id="SETTINGS_ADV_COIN_CONN_INFO_NO_CONNECTED" />
            </Info>
        )}
    </Wrapper>
);

export default ConnectionInfo;
