import { useState } from 'react';
import styled from 'styled-components';

import { Button, H3, P, CoinLogo, variables } from '@trezor/components';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { UserContextPayload } from '@suite-common/suite-types';
import { blockchainActions } from '@suite-common/wallet-core';
import { Modal, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { isOnionUrl } from 'src/utils/suite/tor';
import { useCustomBackends } from 'src/hooks/settings/backends';
import type { Network } from 'src/types/wallet';
import { AdvancedCoinSettingsModal } from 'src/components/suite/modals';

const BackendRowWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    padding: 12px 0;

    & + & {
        border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }
`;

const CoinDescription = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: start;
    margin: 0 16px;
    overflow: hidden;
`;

const CoinTitle = styled.span`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const CoinUrls = styled.span`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
    text-overflow: ellipsis;
    text-align: start;
`;

interface BackendRowProps {
    coin: Network['symbol'];
    urls: string[];
    onSettings: () => void;
}

const BackendRow = ({ coin, urls, onSettings }: BackendRowProps) => (
    <BackendRowWrapper>
        <CoinLogo symbol={coin} />
        <CoinDescription>
            <CoinTitle>
                <Translation id={getTitleForNetwork(coin)} />
            </CoinTitle>
            <CoinUrls>{urls.join(', ')}</CoinUrls>
        </CoinDescription>
        <Button variant="tertiary" onClick={onSettings} icon="SETTINGS">
            <Translation id="TR_GO_TO_SETTINGS" />
        </Button>
    </BackendRowWrapper>
);

const Title = styled(H3)`
    text-align: left;
    margin-bottom: 12px;
`;

const Description = styled(P)`
    text-align: left;
    margin-bottom: 16px;
`;

type DisableTorModalProps = Omit<Extract<UserContextPayload, { type: 'disable-tor' }>, 'type'> & {
    onCancel: () => void;
};

export const DisableTorModal = ({ onCancel, decision }: DisableTorModalProps) => {
    const dispatch = useDispatch();
    const [coin, setCoin] = useState<Network['symbol']>();
    const onionBackends = useCustomBackends().filter(({ urls }) => urls.every(isOnionUrl));

    const onDisableTor = () => {
        onionBackends.forEach(({ coin, type, urls }) =>
            dispatch(
                blockchainActions.setBackend({
                    coin,
                    type,
                    urls: urls.filter(url => !isOnionUrl(url)),
                }),
            ),
        );
        decision.resolve(true);
        onCancel();
    };

    return (
        <>
            <Modal
                isCancelable
                onCancel={onCancel}
                heading={
                    onionBackends.length ? (
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY" />
                    ) : (
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_RESOLVED" />
                    )
                }
                bottomBar={
                    <Button
                        variant={onionBackends.length ? 'secondary' : 'primary'}
                        onClick={onDisableTor}
                    >
                        <Translation
                            id={
                                onionBackends.length
                                    ? 'TR_TOR_REMOVE_ONION_AND_DISABLE'
                                    : 'TR_TOR_DISABLE'
                            }
                        />
                    </Button>
                }
            >
                {onionBackends.length ? (
                    <>
                        <Title>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_TITLE" />
                        </Title>
                        <Description>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_DESCRIPTION" />
                        </Description>
                        {onionBackends.map(({ coin, urls }) => (
                            <BackendRow
                                key={coin}
                                coin={coin}
                                urls={urls}
                                onSettings={() => setCoin(coin)}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        <Title>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE" />
                        </Title>
                        <Description>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_DESCRIPTION" />
                        </Description>
                    </>
                )}
            </Modal>
            {coin && <AdvancedCoinSettingsModal coin={coin} onCancel={() => setCoin(undefined)} />}
        </>
    );
};
