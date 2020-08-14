/**
 * TODO:
 * - Form checking
 * - Reset button
 * - Apply custom backend
 * - Check that the blockbook URL is valid (verify returned coin by the API)
 */

import React, { useState, useRef, useEffect } from 'react';
import TrezorConnect from 'trezor-connect';
import { Modal } from '@trezor/components';
import {
    ActionButton,
    ActionColumn,
    ActionSelect,
    Section,
    SectionItem,
    TextColumn,
} from '@suite-components/Settings';
import { NETWORKS } from '@wallet-config';
import { Props } from './Container';

const AdvancedCoinSettings = ({
    coin,
    blockbookUrls,
    addBlockbookUrl,
    removeBlockbookUrl,
    onCancel,
}: Props) => {
    const { name } = NETWORKS.find(n => n.symbol === coin);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [coinInfo, setCoinInfo] = useState<any>({}); // TODO: Replace any here
    const addRef = useRef(null);

    useEffect(() => {
        TrezorConnect.getCoinInfo({ coin }).then(result => {
            if (result.success) {
                setCoinInfo(result.payload);
            }
        });
    }, [coin]);

    return (
        <Modal
            cancelable
            onCancel={onCancel}
            heading={`${name} (${coin.toUpperCase()}) advanced settings`}
            description="Expert-only settings that can possibly break some functionality."
        >
            <Section>
                {/*
                <SectionItem>
                    <TextColumn
                        title="Change BTC accounts unit"
                        description="1 BTC = 1,000 mBTC = 1,000,000 uBTC"
                    />
                    <ActionColumn>
                        <ActionSelect
                            noTopLabel
                            variant="small"
                            onChange={(option: { value: string; label: string }) => {
                                console.log(option);
                            }}
                            value={1}
                            options={[
                                { value: 0, label: 'Bitcoin' },
                                { value: 1, label: 'mili-Bitcoin' },
                                { value: 2, label: 'micro-Bitcoin' },
                            ]}
                        />
                    </ActionColumn>
                </SectionItem>
                */}
                <SectionItem>
                    <TextColumn
                        title="Blockbook URL"
                        description={`
                            Coins settings also defines the Discovery process when Trezor is connected Each time you connect not remembered devices. 
                            ${
                                coinInfo.blockchainLink
                                    ? `Default: ${coinInfo.blockchainLink.url.join(', ')}`
                                    : ''
                            }
                        `}
                    />
                </SectionItem>
                {blockbookUrls.map(b => (
                    <SectionItem key={b.url}>
                        <ActionColumn>
                            <form onSubmit={() => removeBlockbookUrl(b)}>
                                <input type="text" value={b.url} disabled />
                                <button type="submit">Delete</button>
                            </form>
                        </ActionColumn>
                    </SectionItem>
                ))}
                {isAddingNew && (
                    <SectionItem>
                        <ActionColumn>
                            <form
                                onSubmit={() => {
                                    // TODO: Check for valid URL
                                    // TODO: Check if already exists
                                    if (addRef.current !== null) {
                                        // Add blockbook url
                                        addBlockbookUrl({
                                            coin,
                                            url: addRef.current.value,
                                        });

                                        // Clear add form
                                        addRef.current.value = '';
                                        setIsAddingNew(false);
                                    }
                                }}
                            >
                                <input ref={addRef} type="text" />
                                <button type="submit">Add</button>
                            </form>
                        </ActionColumn>
                    </SectionItem>
                )}
                <SectionItem>
                    <ActionColumn>
                        <button type="button" onClick={() => setIsAddingNew(true)}>
                            {blockbookUrls.length === 0 ? 'Override default' : 'Add more'}
                        </button>
                    </ActionColumn>
                </SectionItem>
            </Section>
        </Modal>
    );
};

export default AdvancedCoinSettings;
