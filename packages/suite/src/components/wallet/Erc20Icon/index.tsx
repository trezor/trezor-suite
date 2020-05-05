import React from 'react';
import styled, { css } from 'styled-components';
import { useTokenList } from '@wallet-hooks/useTokenList';
import { colors, CoinLogo } from '@trezor/components';

const styles = css`
    display: flex;
    border-radius: 50%;
    align-items: center;
    object-fit: cover;
`;

const IconImage = styled.img`
    width: 20px;
    height: 20px;
    ${styles};
`;

const Fallback = styled.div`
    ${styles}
`;

interface Props {
    address: string;
}

export default ({ address }: Props) => {
    const tokenList = useTokenList();
    const isAvailable = tokenList?.includes(address);

    if (!isAvailable)
        return (
            <Fallback>
                <CoinLogo size={18} symbol="eth" color={colors.WHITE} />
            </Fallback>
        );

    const tokenUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    return <IconImage src={tokenUrl} />;
};
