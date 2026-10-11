import { Button, Column, Link, Paragraph, Row, Textarea } from '@trezor/components';

import { NumberedList } from './NumberedList';

/** Where the user takes a signed transaction. The page itself never broadcasts. */
export type SignedTransactionLinks = {
    /** Independent decoder the user checks the hex in before broadcasting it. */
    decoder: string;
    /** Blockbook's "Send Raw Transaction" form, where the user broadcasts the hex. */
    sendTransaction: string;
    /** The explorer page of the transaction. It works once the transaction is broadcast. */
    transaction: string;
};

type SignedTransactionPanelProps = {
    hex: string;
    txid: string;
    /** The page saw the transaction on the network: the hex and the instructions are no longer needed. */
    isOnNetwork: boolean;
    links: SignedTransactionLinks;
    /** What to compare in the decoder's output, as a full sentence. */
    decoderComparison: string;
};

const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
};

// Links are shown as the address the user is going to, so that they can see where they land.
const formatUrl = (url: string) => url.replace(/^https:\/\//, '').replace(/\/$/, '');

const getHost = (url: string) => new URL(url).host;

export const SignedTransactionPanel = ({
    hex,
    txid,
    isOnNetwork,
    links,
    decoderComparison,
}: SignedTransactionPanelProps) => (
    <Column gap={8} width="100%">
        {!isOnNetwork && (
            <>
                <Paragraph>
                    Signed transaction. Keep a copy: it is lost when this page is closed, and this
                    tool will not sign it a second time. This page does not broadcast it; you do, in
                    the steps below.
                </Paragraph>
                <Textarea label="Signed transaction (hex)" value={hex} readOnly rows={4} />
                <Row>
                    <Button size="small" priority="secondary" onClick={() => copyToClipboard(hex)}>
                        Copy
                    </Button>
                </Row>
            </>
        )}

        <Paragraph wordBreak="break-all">Transaction id: {txid}</Paragraph>

        {isOnNetwork ? (
            <Paragraph>
                <Link href={links.transaction}>
                    Show the transaction on {getHost(links.transaction)}
                </Link>
            </Paragraph>
        ) : (
            <NumberedList>
                <NumberedList.Item number={1}>
                    Check the transaction in an independent decoder before you broadcast it: paste
                    the hex at <Link href={links.decoder}>{formatUrl(links.decoder)}</Link>.{' '}
                    {decoderComparison} The hex you paste there becomes known to that site.
                </NumberedList.Item>
                <NumberedList.Item number={2}>
                    Broadcast it on the Trezor explorer: open{' '}
                    <Link href={links.sendTransaction}>{formatUrl(links.sendTransaction)}</Link>,
                    paste the hex into &quot;Send Raw Transaction&quot; and press Send.
                </NumberedList.Item>
                <NumberedList.Item number={3}>
                    Come back here. This page checks the network every half minute and shows the
                    transaction once it appears; &quot;Check the network now&quot; does it at once.
                    Once broadcast, the transaction also has{' '}
                    <Link href={links.transaction}>its page on {getHost(links.transaction)}</Link>.
                </NumberedList.Item>
            </NumberedList>
        )}
    </Column>
);
