import { useState } from 'react';

import TrezorConnect from '@trezor/connect';
import { Input, Button } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useSelector, useDispatch } from 'src/hooks/suite';
import * as nostrActions from 'src/actions/suite/nostrActions';

export const Nostr = () => {
    const device = useSelector(selectDevice);
    const [peerNpub, setPeerNpub] = useState<`npub1${string}` | undefined>(undefined);
    const [addressRequestState, setAddressRequestState] = useState<'none' | 'pending' | 'success'>(
        'none',
    );

    const nostr = useSelector(state => state.nostr);
    const { keys, status: clientStatus, event: events, relayUrl, type } = nostr;
    const { nsec: Nsec, npub: myNpub } = keys;

    /*console.log('status', clientStatus);
    console.log('events, ', events);
    console.log('type', type);
    console.log('Nsec', Nsec);
    console.log('myNpub', myNpub);*/
    const unusedAddress = useSelector(
        state => state.wallet.accounts[0]?.addresses?.unused[0].address,
    );

    const dispatch = useDispatch();

    const handlePeerNpubChange = (event: any) => {
        setPeerNpub(event.target.value);
    };

    const handlePeerNpubClick = () => {
        dispatch(nostrActions.subscribe());
    };

    const handleDisconnectClick = () => {
        dispatch(nostrActions.dispose());
    };

    const handleSendPaymentData = () => {
        dispatch(
            nostrActions.send({
                content: JSON.stringify({
                    type: 'payment_request',
                    payload: `bitcoin:${unusedAddress}?amount=0.1`,
                }),
            }),
        );
    };

    const handleSendAddressRequest = async () => {
        setAddressRequestState('pending');
        await dispatch(
            nostrActions.request({
                kind: 9898,
                tags: [['p', peerNpub]],
                content: JSON.stringify({
                    type: 'address_request',
                }),
            }),
        );
        // .then(result => {
        //     console.log('result', result);
        // });
        setAddressRequestState('success');

        // dispatch()
    };

    const handleAddressRequestResponse = async () => {
        console.log('handleAddressRequestResponse', events);
        if (!device) return;

        const addressResponse = await TrezorConnect.getAddress({
            device,
            useEmptyPassphrase: device.useEmptyPassphrase,
            coin: 'test',
            path: "m/44'/1'/0'/0/0",
            showOnTrezor: false,
        });

        dispatch(
            nostrActions.send({
                kind: 9898,
                tags: [['p', events.pubkey]],
                content: JSON.stringify({
                    type: 'address_response',
                    request_id: events.content.id,
                    payload: addressResponse.payload,
                }),
            }),
        );
    };

    const PeerRequest = ({ pubkey, content }: any) => {
        if (content.type === 'payment_request') {
            return (
                <SectionItem>
                    <TextColumn
                        title="Payment request"
                        description={`received payment data (invoice) from a peer. Peer pubkey: ${pubkey}`}
                    />
                    <ActionColumn>
                        <a href={content.payload}>{content.payload}</a>
                    </ActionColumn>
                </SectionItem>
            );
        }

        if (content.type === 'address_request') {
            return (
                <SectionItem>
                    <TextColumn
                        title="Address request"
                        description={`received address request from a peer. Peer pubkey: ${pubkey}`}
                    />

                    <ActionColumn>
                        <Button onClick={() => handleAddressRequestResponse()}>
                            Send address back
                        </Button>
                    </ActionColumn>
                </SectionItem>
            );
        }

        if (content.type === 'address_response') {
            return (
                <SectionItem>
                    <TextColumn
                        title="Address response"
                        description={
                            <div style={{ lineBreak: 'anywhere' }}>
                                {JSON.stringify(content.payload)}
                            </div>
                        }
                    />
                </SectionItem>
            );
        }

        return null;
    };

    return (
        <>
            <SectionItem>
                <TextColumn title="Client status" description={clientStatus} />
                <TextColumn title="Relay" description={relayUrl} />
                <ActionColumn>
                    {clientStatus === 'disconnected' && <Button onClick={() => {}}>Connect</Button>}
                    {clientStatus === 'connected' && (
                        <Button
                            onClick={() => {
                                handleDisconnectClick();
                            }}
                        >
                            Disconnect
                        </Button>
                    )}
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn title="Nostr identity" description="" />
                <ActionColumn>
                    <Button
                        onClick={() => {
                            dispatch(nostrActions.newIdentity());
                        }}
                    >
                        Create new
                    </Button>
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn title="Nsec" description="" />

                <ActionColumn>
                    <Input
                        isDisabled
                        placeholder="My Nsec"
                        value={Nsec}
                        onChange={() => {}}
                        size="small"
                    />
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn title="Npub" description="" />
                <ActionColumn>
                    <br />
                    <Input disabled={true} placeholder="My Npub" value={myNpub} size="small" />
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn title="Peer identity" description="" />
                <ActionColumn>
                    <Button onClick={handlePeerNpubClick}>Subscribe</Button>
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn title="Npub" description="" />
                <ActionColumn>
                    <Input
                        placeholder="Peer Npub"
                        value={peerNpub}
                        onChange={handlePeerNpubChange}
                        size="small"
                    />
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn
                    title="Send invoice"
                    description="send an invoice and do not wait for response"
                />
                <ActionColumn>
                    <Button
                        isDisabled={!unusedAddress || !peerNpub}
                        onClick={handleSendPaymentData}
                    >
                        Send payment data
                    </Button>
                </ActionColumn>
            </SectionItem>

            <SectionItem>
                <TextColumn
                    title="Send address request"
                    description="Ask peer for address. Wait for response"
                />

                <ActionColumn>
                    <Button
                        onClick={handleSendAddressRequest}
                        isLoading={addressRequestState === 'pending'}
                        isDisabled={!peerNpub || addressRequestState === 'pending'}
                    >
                        Send address request
                    </Button>
                </ActionColumn>
            </SectionItem>

            {clientStatus === 'connected' && (
                <>
                    <SectionItem>
                        <TextColumn
                            title="Inbox"
                            description="The last message received from your peer"
                        />
                    </SectionItem>
                    {events?.kind && <PeerRequest {...events} />}
                </>
            )}

            <SectionItem>
                <TextColumn title={type} description="" />
                <ActionColumn>
                    <Button
                        onClick={() => {
                            dispatch(nostrActions.setIdentity());
                        }}
                    >
                        Switch identity
                    </Button>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
