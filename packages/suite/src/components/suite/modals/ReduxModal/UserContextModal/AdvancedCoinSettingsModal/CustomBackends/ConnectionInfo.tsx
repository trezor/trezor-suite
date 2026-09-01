import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBlockchainState } from '@suite-common/wallet-core';
import { Column, InfoItem, Paragraph } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type ConnectionInfoProps = {
    symbol: NetworkSymbol;
};

const ConnectionInfo = ({ symbol }: ConnectionInfoProps) => {
    const blockchain = useSelector(selectBlockchainState);

    const { connected, url, blockHash: hash, blockHeight: height, version } = blockchain[symbol];

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
                <Translation id="SETTINGS_ADV_COIN_CONN_INFO_NO_CONNECTED" />
            )}
        </Paragraph>
    );
};

export default ConnectionInfo;
