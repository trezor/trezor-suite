import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Column, InfoItem, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
                <Column gap={spacings.sm}>
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
