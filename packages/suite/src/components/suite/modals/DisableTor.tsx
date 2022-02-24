import React from 'react';
import styled from 'styled-components';
import { Button, H3, P, CoinLogo, variables } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import { isOnionUrl } from '@suite-utils/tor';
import { getTitleForNetwork } from '@wallet-utils/accountUtils';
import { setBackend as setBackendAction } from '@settings-actions/walletSettingsActions';
import AdvancedCoinSettings from './AdvancedCoinSettings';
import type { Network } from '@wallet-types';
import type { UserContextPayload } from '@suite-actions/modalActions';

const ButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 24px;
`;

const BackendRowWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    padding: 12px 0;
    & + & {
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
    text-overflow: ellipsis;
    text-align: start;
`;

const BackendRow = ({
    coin,
    urls,
    onSettings,
}: {
    coin: Network['symbol'];
    urls: string[];
    onSettings: () => void;
}) => (
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

type DisableTorProps = Omit<Extract<UserContextPayload, { type: 'disable-tor' }>, 'type'> & {
    onCancel: () => void;
};

export const DisableTor = ({ onCancel, decision }: DisableTorProps) => {
    const backends = useSelector(state => state.wallet.settings.backends);
    const { setBackend } = useActions({
        setBackend: setBackendAction,
    });
    const [coin, setCoin] = React.useState<Network['symbol']>();
    const onionBackends = Object.entries(backends)
        .filter(([_, settings]) => settings.urls.every(isOnionUrl))
        .map(([coin, settings]) => ({ coin: coin as Network['symbol'], ...settings }));

    const onDisableTor = () => {
        onionBackends.forEach(({ coin, type, urls }) =>
            setBackend({ coin, type, urls: urls.filter(url => !isOnionUrl(url)) }),
        );
        decision.resolve(true);
        onCancel();
    };

    return (
        <>
            <Modal
                cancelable
                onCancel={onCancel}
                heading={
                    onionBackends.length ? (
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY" />
                    ) : (
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_RESOLVED" />
                    )
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
                <ButtonWrapper>
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
                </ButtonWrapper>
            </Modal>
            {coin && <AdvancedCoinSettings coin={coin} onCancel={() => setCoin(undefined)} />}
        </>
    );
};
