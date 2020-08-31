import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import TrezorConnect, { CoinInfo } from 'trezor-connect';
import { Modal, Loader } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { NETWORKS } from '@wallet-config';
import { Props } from './Container';

// Sub components
import CustomBlockbookUrls from './components/CustomBlockbookUrls';
import ConnectionInfo from './components/ConnectionInfo';
// import CustomExplorerUrl from './components/CustomExplorerUrl';
// import AccountUnits from './components/AccountUnits';

const Section = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 24px;
    /* margin-bottom: 32px; */
`;

const LoaderWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const AdvancedCoinSettings = ({
    coin,
    blockbookUrls,
    blockchain,
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
        >
            {!coinInfo && (
                <LoaderWrapper>
                    <Loader size={32} />
                </LoaderWrapper>
            )}

            {/* <AccountUnits /> */}
            {coinInfo && isBlockbook && (
                <Section>
                    <CustomBlockbookUrls
                        coin={coin}
                        coinInfo={coinInfo}
                        blockbookUrls={blockbookUrls}
                        addBlockbookUrl={addBlockbookUrl}
                        removeBlockbookUrl={removeBlockbookUrl}
                    />
                </Section>
            )}
            {/* <CustomExplorerUrl /> */}
            <ConnectionInfo
                blockchain={blockchain[coin]}
            />
        </Modal>
    );
};

export default AdvancedCoinSettings;
