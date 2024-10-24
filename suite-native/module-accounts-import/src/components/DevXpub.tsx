import { G } from '@mobily/ts-belt';

import { Button, VStack } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';

type DevXpubProps = {
    symbol: NetworkSymbol;
    onSelect: ({ xpubAddress }: { xpubAddress: string }) => void;
};

const devXpubs: Partial<Record<NetworkSymbol, string | DevXpub[]>> = {
    btc: [
        {
            title: 'SegWit xPub',
            address:
                'zpub6rjNNddoAVvuYaD6WPdxiqFEToQHgrERjWMg7kM9gGGk6rhPMWNEmL5X745FGqBq8Wp136LfA3A7UjRGEYdJrf8dUfshzNrb5rvaryNfVJf',
        },
        {
            title: 'Taproot (zero value)',
            address: `tr([5c9e228d/86'/0'/0']xpub6Bw885JisRbcKmowfBvMmCxaFHodKn1VpmRmctmJJoM8D4DzyP4qJv8ZdD9V9r3SSGjmK2KJEDnvLH6f1Q4HrobEvnCeKydNvf1eir3RHZk/<0;1>/*)`,
        },
    ],
    test: 'vpub5ZjRPuuMiEQnbwEDi9jtH1FaJMajZW78uZ1t3RJXKhxyMoTnPraKwGxiDo9SguDYvSieqjoLJxW5n2t9156RR1oeqRnURuftNZTzejBc4pa',
    regtest:
        'vpub5ZjRPuuMiEQnbwEDi9jtH1FaJMajZW78uZ1t3RJXKhxyMoTnPraKwGxiDo9SguDYvSieqjoLJxW5n2t9156RR1oeqRnURuftNZTzejBc4pa',
    doge: 'dgub8sbe5Mi8LA4dXB9zPfLZW8armvaRkaqT37y6xfT1QA12ErATDf8iGEG8y7kamAnjLuEk9AMpTMMp6EK9Vjp2HHx91xdDEmWYpmD49fpoUYF',
    ltc: 'zpub6qhzAgn63nQAJZiY829GUUb1eXFDqpLbeShTdAbTEKyZa8n2VbkLwbRhq9xqPyj5Yet5TBdbCZDgiw53NQ2qwib4mygybFq66i7ZcXUcwgU',
    bch: 'xpub6DFYZ2FZwJHL4WULnRKTyMAaE9sM5Vi3QoWW9kYWGzR4HxDJ42Gbbdj7bpBAtATpaNeSVqSD3gdFFmZZYK9BVo96rhxPY7SWZWsfmdHpZ7e',
    btg: 'ypub6WVGAPrpnuTJN8AULEnWNNpvFR5Xcckn66fp8sL4FgEy5Z4oig1CbwySvj8v4iFVSANcHJVWzK211Bb8u71bCTVW9vY1PbAn59KmCzq99YW',
    dgb: 'ypub6X7pNV6ouYFiDGHjxCtbnV9EaCdq5uyVysMbR5Q79LHa3SWV93J7ubun37EJhfFQqsSGQBfz3UrAzNtYNhb5JsoPJbNKvbF9wKxBjgxfXkH',
    zec: 'xpub6DNsg962rV1MeqmathySUG2oKso9MfT2hMXCsMp6qemGWwD9xssVM61DfcAUUEaX2G8tjaaoKKppoKtFcSK8KVaMFHmZjAgyqod4DwXopPE',
    eth: [
        { title: 'balance, few tokens', address: '0x62270860B9a5337e46bE8563c512c9137AFa0384' },
        {
            title: 'not zero, no tokens, staking',
            address: '0x607ce71Ae895D7759141c6ae2695a2eb64e92Bb7',
        },
        {
            title: 'not zero, no tokens, no staking',
            address: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
        },
        {
            title: 'Huge account (20k+ transactions)',
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        },
    ],
    etc: '0x500910C4c42F1F2eeAF7E36d0c6f41e0F8858d5f', // Public key, not xpub
    ada: '432505dc5010ec888c650319035dff62f964002f02473fa7fd65dd67f9bd80b327674cabf29c39a14c367dbae5ee01f967f8b4c3ad63a45468da8f28bb2e03d5',
    txrp: 'rJX2KwzaLJDyFhhtXKi3htaLfaUH2tptEX',
    xrp: 'r9TCDt3HmszcsnPrUrnvpynvLgaGQom9x3',
};

type DevXpub = {
    address: string;
    title: string;
};

export const DevXpub = ({ symbol, onSelect }: DevXpubProps) => {
    const xpub = devXpubs[symbol];

    if (!xpub) return null;

    if (G.isArray(xpub)) {
        return (
            <VStack spacing="sp16">
                {xpub.map(({ address, title }, index) => {
                    const testIdSuffix = index === 0 ? '' : `/${index}`;

                    return (
                        <Button
                            key={address}
                            data-testID={`@accounts-import/sync-coins/dev-xpub/${symbol}${testIdSuffix}`}
                            onPress={() => onSelect({ xpubAddress: address })}
                            colorScheme="tertiaryElevation0"
                        >
                            DEV: {title}
                        </Button>
                    );
                })}
            </VStack>
        );
    }

    return (
        <Button
            data-testID={`@accounts-import/sync-coins/dev-xpub/${symbol}`}
            onPress={() => onSelect({ xpubAddress: xpub })}
            colorScheme="tertiaryElevation0"
        >
            Use dev xPub
        </Button>
    );
};
