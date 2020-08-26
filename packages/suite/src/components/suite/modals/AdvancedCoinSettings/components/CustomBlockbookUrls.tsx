import React, { useState, useRef } from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import styled from 'styled-components';
import { CoinInfo } from 'trezor-connect';
import { Input, Button, colors, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { Network } from '@suite/types/wallet';
import { BlockbookUrl } from '@wallet-types/blockbook';
import { isUrl } from '@suite-utils/validators';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

const AddButton = styled(Button)`
    align-self: flex-start;
    margin-top: 12px;
`;

const Heading = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: 6px;
`;

const Description = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    line-height: 1.57;
    /* margin-bottom: 14px; */
`;

const DefaultValues = styled(Description)`
    font-weight: 500;
    /* margin-top: 4px; */
    margin-bottom: 14px;
`;

interface Props extends WrappedComponentProps {
    coin: Network['symbol'];
    coinInfo: CoinInfo;
    blockbookUrls: BlockbookUrl[];
    addBlockbookUrl: (params: BlockbookUrl) => void;
    removeBlockbookUrl: (params: BlockbookUrl) => void;
}

const CustomBlockbookUrls = ({
    coin,
    coinInfo,
    blockbookUrls,
    addBlockbookUrl,
    removeBlockbookUrl,
    ...props
}: Props) => {
    const [addErrorMessage, setAddErrorMessage] = useState<string | null>(null);
    const addRef = useRef<HTMLInputElement>(null);

    const addUrl = () => {
        if (addRef.current !== null) {
            const url = addRef.current.value;

            // URL is not valid
            if (!isUrl(url)) {
                setAddErrorMessage(
                    props.intl.formatMessage(messages.TR_CUSTOM_BACKEND_INVALID_URL),
                );
                return;
            }

            // URL already exists
            if (blockbookUrls.find(b => b.coin === coin && b.url === url)) {
                setAddErrorMessage(
                    props.intl.formatMessage(messages.TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED),
                );
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

    const urls = blockbookUrls.filter(b => b.coin === coin);

    return (
        <Wrapper>
            <Heading>
                <Translation id="SETTINGS_ADV_COIN_BLOCKBOOK_TITLE" />
            </Heading>
            <Description>
                <Translation id="SETTINGS_ADV_COIN_BLOCKBOOK_DESCRIPTION" />
            </Description>
            <DefaultValues>
                <Translation
                    id="TR_DEFAULT_VALUE"
                    values={{
                        value: coinInfo.blockchainLink
                            ? coinInfo.blockchainLink.url.join(', ')
                            : '',
                    }}
                />
            </DefaultValues>

            {urls.map(b => (
                <Input
                    key={b.url}
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
            ))}

            <Input
                placeholder={`e.g. https://${coin}1.trezor.io/`}
                innerRef={addRef}
                noTopLabel
                type="text"
                state={addErrorMessage ? 'error' : undefined}
                bottomText={addErrorMessage}
            />

            <AddButton variant="tertiary" icon="PLUS" onClick={addUrl}>
                <Translation id="TR_ADD_NEW_BLOCKBOOK_BACKEND" />
            </AddButton>
        </Wrapper>
    );
};

export default injectIntl(CustomBlockbookUrls);
