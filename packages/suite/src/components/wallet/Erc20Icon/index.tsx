import React, { useContext } from 'react';
import styled, { css } from 'styled-components';
import { colors, CoinLogo } from '@trezor/components';
import { SupportedIconsContext } from '@wallet-views/transactions';

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
    width: 24px;
    height: 24px;
    ${styles}
`;

export default ({ address }: { address: string }) => {
    const data = useContext(SupportedIconsContext);
    const isAvailable = data.supportedTokenIcons?.includes(address);

    if (!isAvailable)
        return (
            <Fallback>
                <CoinLogo size={18} symbol="eth" color={colors.WHITE} />
            </Fallback>
        );

    const tokenUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    return <IconImage src={tokenUrl} />;
};
