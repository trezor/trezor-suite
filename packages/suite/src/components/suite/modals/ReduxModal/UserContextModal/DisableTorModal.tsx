import { useState } from 'react';

import { Translation } from '@suite/intl';
import { isOnionUrl } from '@suite/tor';
import { type UserContextPayload } from '@suite-common/suite-types';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { blockchainActions, selectCustomBackends } from '@suite-common/wallet-core';
import { Banner, Button, Card, Column, H3, Modal, Paragraph, Row } from '@trezor/components';
import { GearIcon, TorBrowserIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { AdvancedCoinSettingsModal } from './AdvancedCoinSettingsModal/AdvancedCoinSettingsModal';

type DisableTorModalProps = Omit<Extract<UserContextPayload, { type: 'disable-tor' }>, 'type'> & {
    onCancel: () => void;
};

export const DisableTorModal = ({ onCancel, decision }: DisableTorModalProps) => {
    const dispatch = useDispatch();
    const [symbol, setSymbol] = useState<NetworkSymbol>();
    const customBackends = useSelector(selectCustomBackends);
    const onionBackends = customBackends.filter(({ urls }) => urls.every(isOnionUrl));

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
        <AdvancedCoinSettingsModal
            symbol={symbol}
            onCancel={() => setSymbol(undefined)}
            onBackClick={() => setSymbol(undefined)}
        />
    ) : (
        <Modal
            onCancel={onCancel}
            intent={onionBackends.length ? 'warning' : 'brand'}
            width={600}
            icon={onionBackends.length ? undefined : TorBrowserIcon}
            heading={
                onionBackends.length ? <Translation id="TR_TOR_DISABLE_ONIONS_ONLY" /> : undefined
            }
            bottomContent={
                <>
                    <Modal.Button onClick={onDisableTor}>
                        <Translation
                            id={
                                onionBackends.length
                                    ? 'TR_TOR_REMOVE_ONION_AND_DISABLE'
                                    : 'TR_TOR_DISABLE'
                            }
                        />
                    </Modal.Button>
                    <Modal.Button onClick={onCancel} intent="neutral" priority="secondary">
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            {onionBackends.length ? (
                <Column gap={spacings.md}>
                    <Banner
                        intent="warning"
                        icon={TorBrowserIcon}
                        description={
                            <>
                                <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_TITLE" />{' '}
                                <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_DESCRIPTION" />
                            </>
                        }
                    />
                    <Card>
                        <Column gap={spacings.xxl} hasDivider>
                            {onionBackends.map(({ symbol, urls }) => (
                                <Row key={symbol} gap={spacings.md}>
                                    <TokenIcon symbol={symbol} />
                                    <Column>
                                        <Paragraph>{getNetwork(symbol).name}</Paragraph>
                                        <Paragraph
                                            intent="neutral"
                                            priority="secondary"
                                            typographyStyle="body-sm"
                                            ellipsisLineCount={1}
                                        >
                                            {urls.join(', ')}
                                        </Paragraph>
                                    </Column>
                                    <Button
                                        intent="neutral"
                                        priority="secondary"
                                        onClick={() => setSymbol(symbol)}
                                        iconLeft={GearIcon}
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
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE" />
                    </Paragraph>
                </Column>
            )}
        </Modal>
    );
};
