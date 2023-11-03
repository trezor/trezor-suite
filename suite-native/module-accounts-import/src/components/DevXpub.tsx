import { Box, Button } from '@suite-native/atoms';
import { NetworkSymbol } from '@suite-common/wallet-config';

type DevXpubProps = {
    symbol: NetworkSymbol;
    onSelect: ({ xpubAddress }: { xpubAddress: string }) => void;
};

const devXpubs: Partial<Record<NetworkSymbol, string>> = {
    btc: 'zpub6rjNNddoAVvuYaD6WPdxiqFEToQHgrERjWMg7kM9gGGk6rhPMWNEmL5X745FGqBq8Wp136LfA3A7UjRGEYdJrf8dUfshzNrb5rvaryNfVJf',
    test: 'vpub5ZjRPuuMiEQnbwEDi9jtH1FaJMajZW78uZ1t3RJXKhxyMoTnPraKwGxiDo9SguDYvSieqjoLJxW5n2t9156RR1oeqRnURuftNZTzejBc4pa',
    doge: 'dgub8sbe5Mi8LA4dXB9zPfLZW8armvaRkaqT37y6xfT1QA12ErATDf8iGEG8y7kamAnjLuEk9AMpTMMp6EK9Vjp2HHx91xdDEmWYpmD49fpoUYF',
    ltc: 'zpub6qhzAgn63nQAJZiY829GUUb1eXFDqpLbeShTdAbTEKyZa8n2VbkLwbRhq9xqPyj5Yet5TBdbCZDgiw53NQ2qwib4mygybFq66i7ZcXUcwgU',
    bch: 'xpub6DFYZ2FZwJHL4WULnRKTyMAaE9sM5Vi3QoWW9kYWGzR4HxDJ42Gbbdj7bpBAtATpaNeSVqSD3gdFFmZZYK9BVo96rhxPY7SWZWsfmdHpZ7e',
    btg: 'ypub6WVGAPrpnuTJN8AULEnWNNpvFR5Xcckn66fp8sL4FgEy5Z4oig1CbwySvj8v4iFVSANcHJVWzK211Bb8u71bCTVW9vY1PbAn59KmCzq99YW',
    dgb: 'ypub6X7pNV6ouYFiDGHjxCtbnV9EaCdq5uyVysMbR5Q79LHa3SWV93J7ubun37EJhfFQqsSGQBfz3UrAzNtYNhb5JsoPJbNKvbF9wKxBjgxfXkH',
    zec: 'xpub6DNsg962rV1MeqmathySUG2oKso9MfT2hMXCsMp6qemGWwD9xssVM61DfcAUUEaX2G8tjaaoKKppoKtFcSK8KVaMFHmZjAgyqod4DwXopPE',
    eth: '0x62270860B9a5337e46bE8563c512c9137AFa0384', // Public key, not xpub
    ada: '432505dc5010ec888c650319035dff62f964002f02473fa7fd65dd67f9bd80b327674cabf29c39a14c367dbae5ee01f967f8b4c3ad63a45468da8f28bb2e03d5',
    txrp: 'rJX2KwzaLJDyFhhtXKi3htaLfaUH2tptEX',
};

export const DevXpub = ({ symbol, onSelect }: DevXpubProps) => {
    const xpub = devXpubs[symbol];
    if (!xpub) return null;
    return (
        <Box marginTop="medium">
            <Button
                testID={`@accounts-import/sync-coins/dev-xpub/${symbol}`}
                onPress={() => onSelect({ xpubAddress: xpub })}
                colorScheme="tertiaryElevation0"
            >
                Use dev xPub
            </Button>
        </Box>
    );
};
