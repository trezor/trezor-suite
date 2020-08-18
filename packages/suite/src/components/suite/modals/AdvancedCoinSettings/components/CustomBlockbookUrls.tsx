import React, { useState, useRef } from 'react';
import { CoinInfo } from 'trezor-connect';
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
    const [isAddingNew, setIsAddingNew] = useState(false);
    const addRef = useRef<HTMLInputElement>(null);

    const addUrl = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (addRef.current !== null) {
            const url = addRef.current.value;

            // URL is not valid
            if (!isUrl(url)) {
                // TODO: Display error
                return;
            }

            // URL already exists
            if (blockbookUrls.find(b => b.coin === coin && b.url === url)) {
                // TODO: Display error
                return;
            }

            // Add blockbook url
            addBlockbookUrl({
                coin,
                url: addRef.current.value,
            });

            // Clear add form
            addRef.current.value = '';
            setIsAddingNew(false);
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
                        <input type="text" value={b.url} disabled />
                        <button type="button" onClick={() => removeBlockbookUrl(b)}>
                            X
                        </button>
                    </ActionColumn>
                </SectionItem>
            ))}
            {isAddingNew && (
                <SectionItem>
                    <ActionColumn>
                        <form onSubmit={addUrl}>
                            <input ref={addRef} type="text" />
                            <button type="submit">Add</button>
                        </form>
                    </ActionColumn>
                </SectionItem>
            )}
            <SectionItem>
                <ActionColumn>
                    <button type="button" onClick={() => setIsAddingNew(true)}>
                        + Add new
                    </button>
                </ActionColumn>
            </SectionItem>
        </>
    );
};

export default CustomBlockbookUrls;
