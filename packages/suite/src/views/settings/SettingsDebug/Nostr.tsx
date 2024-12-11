import { useEffect, useState } from 'react';

import { Input, Button } from '@trezor/components';
import { NostrClient, Event } from '@trezor/connect-nostr';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

export const Nostr = () => {
    const [Nsec, setNsec] = useState(
        'nsec12rfalrsa6dvnxjhhf4n0d2k4rc2wc8hy49qvp34k2hj8p7cppnnq8ysujz',
    );
    const [myNpub, setMyNpub] = useState('');
    const [peerNpub, setPeerNpub] = useState('');
    const [client, setClient] = useState<NostrClient | null>(null);
    const [events, setEvents] = useState<Event>();
    const [clientStatus, setClientStatus] = useState('disconnected');
    const [addressRequestState, setAddressRequestState] = useState<'none' | 'pending' | 'success'>(
        'none',
    );

    const unusedAddress = useSelector(
        state => state.wallet.accounts[0]?.addresses?.unused[0].address,
    );

    const handleChange = (event: any) => {
        setNsec(event.target.value);
    };

    const handlePeerNpubChange = (event: any) => {
        setPeerNpub(event.target.value);
    };

    const initPeerToPeerClient = async () => {
        const nostrClient = new NostrClient({
            nsecStr: Nsec,
            relayUrl: 'wss://relay.primal.net',
        });
        setClient(nostrClient);
        if (nostrClient.npub) {
            setMyNpub(nostrClient.npub);
        }

        nostrClient.on('event', message => {
            console.log('message', message);

            if (message) {
                const { content } = message;
                setEvents({ ...message, content: JSON.parse(content) });
            }
        });

        nostrClient.on('status', status => {
            setClientStatus(status);
        });

        await nostrClient.connect();
    };

    useEffect(() => {
        initPeerToPeerClient();
    }, []);

    const handlePeerNpubClick = () => {
        client?.subscribe({ pubKeys: [peerNpub] });
    };

    const handleDisconnectClick = async () => {
        client?.dispose();
    };
    const handleSendPaymentData = () => {
        client?.send({
            content: JSON.stringify({
                type: 'payment_request',
                payload: `bitcoin:${unusedAddress}?amount=0.1`,
            }),
        });
    };

    const handleSendAddressRequest = () => {
        setAddressRequestState('pending');
        client
            ?.request({
                content: JSON.stringify({
                    type: 'address_request',
                }),
            })
            .then(result => {
                console.log('result', result);
                setAddressRequestState('success');
            });
    };

    const handleAddressRequestResponse = (content: any) => {
        console.log('handleAddressRequestResponse', content);

        client?.send({
            content: JSON.stringify({
                type: 'address_response',
                request_id: content.id,
                payload: unusedAddress,
            }),
        });
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
                        title={`Address request`}
                        description={`received address request from a peer. Peer pubkey: ${pubkey}`}
                    />

                    <ActionColumn>
                        <Button onClick={() => handleAddressRequestResponse(content)}>
                            Send address back
                        </Button>
                    </ActionColumn>
                </SectionItem>
            );
        }

        if (content.type === 'address_response') {
            return (
                <SectionItem>
                    <TextColumn title={`Address response`} description={content.payload} />
                </SectionItem>
            );
        }

        return null;
    };

    console.log(events);

    return (
        <>
            <SectionItem>
                <TextColumn title="Client status" description={clientStatus} />
                <TextColumn title="Relay" description={client?.relay.url} />
                <ActionColumn>
                    {clientStatus === 'disconnected' && (
                        <Button onClick={initPeerToPeerClient}>Connect</Button>
                    )}
                    {clientStatus === 'connected' && (
                        <Button onClick={handleDisconnectClick}>Disconnect</Button>
                    )}
                </ActionColumn>
            </SectionItem>
            <SectionItem>
                <TextColumn title="Nostr identity" description="" />
                <ActionColumn>
                    <Button
                        onClick={() => {
                            client?.newIdentity();
                            setNsec(client?.nsecStr!);
                            setMyNpub(client?.npub!);
                            console.log('client', client);
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
                        onChange={handleChange}
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
                    {events && <PeerRequest {...events} />}
                </>
            )}
        </>
    );
};
