import React, { useState, useRef } from 'react';
import { CoinInfo } from 'trezor-connect';
import { Input, Button } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { Network } from '@suite/types/wallet';
import { BlockbookUrl } from '@wallet-types/blockbook';
import { isUrl } from '@suite-utils/validators';

type Props = {
    coin: Network['symbol'];
    coinInfo: CoinInfo;
    blockbookUrls: BlockbookUrl[];
    addBlockbookUrl: (params: BlockbookUrl) => void;
    removeBlockbookUrl: (params: BlockbookUrl) => void;
};

const CustomBlockbookUrls = ({
    coin,
    coinInfo,
    blockbookUrls,
    addBlockbookUrl,
    removeBlockbookUrl,
}: Props) => {
    const [addErrorMessage, setAddErrorMessage] = useState<string | null>(null);
    const addRef = useRef<HTMLInputElement>(null);

    const addUrl = () => {
        if (addRef.current !== null) {
            const url = addRef.current.value;

            // URL is not valid
            if (!isUrl(url)) {
                setAddErrorMessage('Invalid URL.'); // TODO: Translate message
                return;
            }

            // URL already exists
            if (blockbookUrls.find(b => b.coin === coin && b.url === url)) {
                // TODO: Display error
                setAddErrorMessage('Backend already added for this coin.');
                return;
            }

            // Add blockbook url
            addBlockbookUrl({
                coin,
                url: addRef.current.value,
            });

            // Clear add form and errors
            addRef.current.value = '';
            setAddErrorMessage(null);
        }
    };

    return (
        <>
            <SectionItem>
                <TextColumn
                    title={<Translation id="SETTINGS_ADV_COIN_BLOCKBOOK_TITLE" />}
                    description={
                        <Translation
                            id="SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION"
                            values={{
                                newLine: <br />,
                                urls: coinInfo.blockchainLink
                                    ? coinInfo.blockchainLink.url.join(', ')
                                    : '',
                            }}
                        />
                    }
                />
            </SectionItem>
            {blockbookUrls.map(b => (
                <SectionItem key={b.url}>
                    <ActionColumn>
                        <Input
                            value={b.url}
                            noTopLabel
                            isDisabled
                            innerAddon={
                                <Button
                                    variant="tertiary"
                                    icon="CROSS"
                                    onClick={() => removeBlockbookUrl(b)}
                                />
                            }
                        />
                    </ActionColumn>
                </SectionItem>
            ))}
            <SectionItem>
                <ActionColumn>
                    <Input
                        placeholder={`https://${coin}1.trezor.io/`}
                        innerRef={addRef}
                        noTopLabel
                        type="text"
                        state={addErrorMessage ? 'error' : undefined}
                        bottomText={addErrorMessage}
                        innerAddon={
                            <Button variant="tertiary" icon="PLUS" onClick={addUrl}>
                                Add new
                            </Button>
                        }
                    />
                </ActionColumn>
            </SectionItem>
        </>
    );
};

export default CustomBlockbookUrls;
