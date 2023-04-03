import React from 'react';

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
    zec: 'xpub6CQdEahwhKRSn9BFc7oWpzNoeqG2ygv3xdofyk7He93NMjvDpGvcQ2o4dZfBNXpqzKydaHp5rhXRT3zYhRYJAErXxarH37f9hgRZ6UPiqfg',
    eth: '0x62270860B9a5337e46bE8563c512c9137AFa0384', // Public key, not xpub
    ada: 'd507c8f866691bd96e131334c355188b1a1d0b2fa0ab11545075aab332d77d9eb19657ad13ee581b56b0f8d744d66ca356b93d42fe176b3de007d53e9c4c4e7a',
    txrp: 'rJX2KwzaLJDyFhhtXKi3htaLfaUH2tptEX',
};

export const DevXpub = ({ symbol, onSelect }: DevXpubProps) => {
    const xpub = devXpubs[symbol];
    if (!xpub) return null;
    return (
        <Box marginTop="medium">
            <Button
                onPress={() => onSelect({ xpubAddress: xpub })}
                colorScheme="tertiaryElevation0"
            >
                Use dev xPub
            </Button>
        </Box>
    );
};
