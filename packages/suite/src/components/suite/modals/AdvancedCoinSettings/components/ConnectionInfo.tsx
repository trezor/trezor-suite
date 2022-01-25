import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { Translation } from '@suite-components/Translation';
import type { Network } from '@wallet-types';

const Wrapper = styled(P)`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

interface Props {
    coin: Network['symbol'];
}

const ConnectionInfo = ({ coin }: Props) => {
    const { blockchain } = useSelector(state => ({
        blockchain: state.wallet.blockchain,
    }));
    const { connected, url, blockHash: hash, blockHeight: height, version } = blockchain[coin];
    return (
        <Wrapper size="small">
            {connected ? (
                <>
                    <Translation id="SETTINGS_ADV_COIN_CONN_INFO_URL" values={{ url }} />
                    <Translation id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HASH" values={{ hash }} />
                    <Translation
                        id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HEIGHT"
                        values={{ height }}
                    />
                    <Translation id="SETTINGS_ADV_COIN_CONN_INFO_VERSION" values={{ version }} />
                </>
            ) : (
                <Translation id="SETTINGS_ADV_COIN_CONN_INFO_NO_CONNECTED" />
            )}
        </Wrapper>
    );
};

export default ConnectionInfo;
