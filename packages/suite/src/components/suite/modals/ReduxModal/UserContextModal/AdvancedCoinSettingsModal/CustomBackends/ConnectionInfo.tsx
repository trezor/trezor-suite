import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useSelector } from 'src/hooks/suite';

type ConnectionInfoProps = {
    symbol: NetworkSymbol;
};

const ConnectionInfo = ({ symbol }: ConnectionInfoProps) => {
    const blockchain = useSelector(state => state.wallet.blockchain);

    const { connected, url, blockHash: hash, blockHeight: height, version } = blockchain[symbol];

    return (
        <Paragraph typographyStyle="hint">
            {connected ? (
                <>
                    <Translation id="SETTINGS_ADV_COIN_CONN_INFO_URL" values={{ url }} />
                    <br />
                    <Translation id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HASH" values={{ hash }} />
                    <br />
                    <Translation
                        id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HEIGHT"
                        values={{ height }}
                    />
                    <br />
                    <Translation id="SETTINGS_ADV_COIN_CONN_INFO_VERSION" values={{ version }} />
                </>
            ) : (
                <Translation id="SETTINGS_ADV_COIN_CONN_INFO_NO_CONNECTED" />
            )}
        </Paragraph>
    );
};

export default ConnectionInfo;
