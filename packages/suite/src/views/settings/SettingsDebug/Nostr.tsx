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
        setMyNpub(nostrClient.pk);

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
    const handleSendPaymentRequest = () => {
        client?.send({
            content: JSON.stringify({
                type: 'payment_request',
                payload: `bitcoin:${unusedAddress}?amount=0.1`,
            }),
        });
    };

    const handleSendAddressRequest = () => {
        client?.send({
            content: JSON.stringify({
                type: 'address_request',
            }),
        });
    };

    const handleAddressRequestResponse = () => {
        client?.send({
            content: JSON.stringify({
                type: 'address_response',
                payload: unusedAddress,
            }),
        });
    };

    const PeerRequest = ({ created_at, pubkey, content }: any) => {
        if (content.type === 'payment_request') {
            return (
                <div>
                    <p>timestamp: {created_at} </p>
                    <p>from {pubkey}</p>
                    <p>
                        <a href={content.payload}>{content.payload}</a>
                    </p>
                </div>
            );
        }

        if (content.type === 'address_request') {
            return (
                <div>
                    <p>timestamp: {created_at} </p>
                    <p>from {pubkey}</p>
                    <Button onClick={handleAddressRequestResponse}>Send address back</Button>
                </div>
            );
        }

        if (content.type === 'address_response') {
            return (
                <div>
                    <p>yay, we received address: {content.payload} </p>
                </div>
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
                            setMyNpub(client?.pk!);
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
                <TextColumn title="Pubk" description="" />
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
                <TextColumn title="Pubk" description="" />
                <ActionColumn>
                    <Input
                        placeholder="Peer Npub"
                        value={peerNpub}
                        onChange={handlePeerNpubChange}
                        size="small"
                    />
                </ActionColumn>
            </SectionItem>

            {peerNpub && clientStatus === 'connected' && (
                <>
                    <SectionItem>
                        <TextColumn title="Send message" description="Ask peer for address" />
                        <Button onClick={handleSendPaymentRequest} isDisabled={!unusedAddress}>
                            Send payment request
                        </Button>
                        <Button onClick={handleSendAddressRequest} isDisabled={!unusedAddress}>
                            Send address request
                        </Button>
                    </SectionItem>

                    <SectionItem>
                        <TextColumn title="Last message received" description="" />
                        {events && <PeerRequest {...events} />}
                    </SectionItem>
                </>
            )}
        </>
    );
};
