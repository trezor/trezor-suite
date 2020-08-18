import React, { useState, useEffect } from 'react';
import TrezorConnect, { CoinInfo } from 'trezor-connect';
import { Modal } from '@trezor/components';
import { Section } from '@suite-components/Settings';
import { Translation } from '@suite-components/Translation';
import { NETWORKS } from '@wallet-config';
import { Props } from './Container';

// Sub components
import CustomBlockbookUrls from './components/CustomBlockbookUrls';
import CustomExplorerUrl from './components/CustomExplorerUrl';
import AccountUnits from './components/AccountUnits';

const AdvancedCoinSettings = ({
    coin,
    blockbookUrls,
    addBlockbookUrl,
    removeBlockbookUrl,
    onCancel,
}: Props) => {
    const network = NETWORKS.find(n => n.symbol === coin);
    const [coinInfo, setCoinInfo] = useState<CoinInfo>();
    const isBlockbook = coinInfo?.blockchainLink?.type === 'blockbook';

    useEffect(() => {
        TrezorConnect.getCoinInfo({ coin }).then(result => {
            if (result.success) {
                setCoinInfo(result.payload);
            }
        });
    }, [coin]);

    // Network should exist if the coin is correct
    if (network === undefined) {
        return null;
    }

    // TODO: Display loader while coin info is loading
    if (coinInfo === undefined) {
        return null;
    }

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={
                <Translation
                    id="SETTINGS_ADV_COIN_MODAL_TITLE"
                    values={{ name: network.name, coin: coin.toUpperCase() }}
                />
            }
            description={<Translation id="SETTINGS_ADV_COIN_MODAL_DESCRIPTION" />}
        >
            <Section>
                <AccountUnits />
                {isBlockbook && (
                    <CustomBlockbookUrls
                        coin={coin}
                        coinInfo={coinInfo}
                        blockbookUrls={blockbookUrls}
                        addBlockbookUrl={addBlockbookUrl}
                        removeBlockbookUrl={removeBlockbookUrl}
                    />
                )}
                <CustomExplorerUrl />
            </Section>
        </Modal>
    );
};

export default AdvancedCoinSettings;
