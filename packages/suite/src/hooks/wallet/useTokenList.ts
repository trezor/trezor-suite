import { useEffect, useState } from 'react';

export function useTokenList() {
    const [error, setError] = useState(false);
    const [tokenList, setTokenList] = useState<string[]>([]);
    const listUrl =
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/whitelist.json';

    useEffect(() => {
        fetch(listUrl)
            .then(response => {
                if (response.status !== 200) {
                    setError(true);
                }
                return response.json();
            })
            .then(data => setTokenList(data));
    }, []);

    if (error) return null;

    return tokenList;
}
