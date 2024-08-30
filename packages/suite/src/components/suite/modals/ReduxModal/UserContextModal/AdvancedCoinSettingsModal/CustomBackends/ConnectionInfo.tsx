import styled from 'styled-components';
import { Paragraph } from '@trezor/components';
import { useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite/Translation';
import { NetworkCompatible } from '@suite-common/wallet-config';

const Wrapper = styled(Paragraph)`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

interface ConnectionInfoProps {
    coin: NetworkCompatible['symbol'];
}

const ConnectionInfo = ({ coin }: ConnectionInfoProps) => {
    const blockchain = useSelector(state => state.wallet.blockchain);

    const { connected, url, blockHash: hash, blockHeight: height, version } = blockchain[coin];

    return (
        <Wrapper typographyStyle="hint">
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
