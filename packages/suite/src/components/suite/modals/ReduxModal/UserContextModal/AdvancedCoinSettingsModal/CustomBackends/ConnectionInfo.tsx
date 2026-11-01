import { Translation } from '@suite/intl';
import { type NetworkSymbol, selectNetworkConfig } from '@suite-common/networks';
import { selectNetworkBlockchainInfo } from '@suite-common/wallet-core';
import { Column, InfoItem, Paragraph } from '@trezor/components';

import { useSelector } from 'src/hooks/suite/useSelector';

type ConnectionInfoProps = {
    symbol: NetworkSymbol;
};

const ConnectionInfo = ({ symbol }: ConnectionInfoProps) => {
    const blockchain = useSelector(state => selectNetworkBlockchainInfo(state, symbol));
    const networkName = useSelector(state => selectNetworkConfig(state, symbol)?.name ?? symbol);

    const { connected, url, blockHash: hash, blockHeight: height, version } = blockchain;

    return (
        <Paragraph typographyStyle="body-sm">
            {connected ? (
                <Column gap={12}>
                    <InfoItem label={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_URL" />}>
                        {url}
                    </InfoItem>

                    <InfoItem label={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HASH" />}>
                        {hash}
                    </InfoItem>

                    <InfoItem label={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_BLOCK_HEIGHT" />}>
                        {height}
                    </InfoItem>

                    <InfoItem label={<Translation id="SETTINGS_ADV_COIN_CONN_INFO_VERSION" />}>
                        {version}
                    </InfoItem>
                </Column>
            ) : (
                <Translation
                    id="SETTINGS_ADV_COIN_CONN_INFO_NOT_CONNECTED"
                    values={{ networkName }}
                />
            )}
        </Paragraph>
    );
};

export default ConnectionInfo;
