import { useState } from 'react';

import { UserContextPayload } from '@suite-common/suite-types';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { blockchainActions } from '@suite-common/wallet-core';
import { Banner, Button, Card, Column, H3, NewModal, Paragraph, Row } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { AdvancedCoinSettingsModal } from 'src/components/suite/modals';
import { useCustomBackends } from 'src/hooks/settings/backends';
import { useDispatch } from 'src/hooks/suite';
import { isOnionUrl } from 'src/utils/suite/tor';

type DisableTorModalProps = Omit<Extract<UserContextPayload, { type: 'disable-tor' }>, 'type'> & {
    onCancel: () => void;
};

export const DisableTorModal = ({ onCancel, decision }: DisableTorModalProps) => {
    const dispatch = useDispatch();
    const [symbol, setSymbol] = useState<NetworkSymbol>();
    const onionBackends = useCustomBackends().filter(({ urls }) => urls.every(isOnionUrl));

    const onDisableTor = () => {
        onionBackends.forEach(({ symbol, type, urls }) =>
            dispatch(
                blockchainActions.setBackend({
                    symbol,
                    type,
                    urls: urls.filter(url => !isOnionUrl(url)),
                }),
            ),
        );
        decision.resolve(true);
        onCancel();
    };

    return symbol ? (
        <AdvancedCoinSettingsModal symbol={symbol} onCancel={() => setSymbol(undefined)} />
    ) : (
        <NewModal
            onCancel={onCancel}
            variant={onionBackends.length ? 'warning' : 'primary'}
            size="small"
            iconName={onionBackends.length ? undefined : 'torBrowser'}
            heading={
                onionBackends.length ? <Translation id="TR_TOR_DISABLE_ONIONS_ONLY" /> : undefined
            }
            bottomContent={
                <>
                    <NewModal.Button onClick={onDisableTor}>
                        <Translation
                            id={
                                onionBackends.length
                                    ? 'TR_TOR_REMOVE_ONION_AND_DISABLE'
                                    : 'TR_TOR_DISABLE'
                            }
                        />
                    </NewModal.Button>
                    <NewModal.Button onClick={onCancel} variant="tertiary">
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            {onionBackends.length ? (
                <Column gap={spacings.md}>
                    <Banner variant="warning" icon="torBrowser">
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_TITLE" />{' '}
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_DESCRIPTION" />
                    </Banner>
                    <Card>
                        <Column gap={spacings.xxl} hasDivider>
                            {onionBackends.map(({ symbol, urls }) => (
                                <Row key={symbol} gap={spacings.md}>
                                    <CoinLogo symbol={symbol} />
                                    <Column>
                                        <Paragraph>{getNetwork(symbol).name}</Paragraph>
                                        <Paragraph
                                            variant="tertiary"
                                            typographyStyle="hint"
                                            ellipsisLineCount={1}
                                        >
                                            {urls.join(', ')}
                                        </Paragraph>
                                    </Column>
                                    <Button
                                        variant="tertiary"
                                        onClick={() => setSymbol(symbol)}
                                        icon="gear"
                                        size="small"
                                        margin={{ left: 'auto' }}
                                    >
                                        <Translation id="TR_GO_TO_SETTINGS" />
                                    </Button>
                                </Row>
                            ))}
                        </Column>
                    </Card>
                </Column>
            ) : (
                <Column gap={spacings.xxs}>
                    <H3>
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_DESCRIPTION" />
                    </H3>
                    <Paragraph variant="tertiary">
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE" />
                    </Paragraph>
                </Column>
            )}
        </NewModal>
    );
};
