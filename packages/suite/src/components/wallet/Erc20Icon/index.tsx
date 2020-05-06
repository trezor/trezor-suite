import React from 'react';
import styled, { css } from 'styled-components';
import { Props as ContainerProps } from './Container';
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
    width: 24px;
    height: 24px;
    ${styles}
`;

interface Props {
    address: string;
    supportedIcons: ContainerProps['supportedIcons'];
    supportedIconsActions: ContainerProps['supportedIconsActions'];
}

export default ({ address, supportedIcons, supportedIconsActions }: Props) => {
    if (!supportedIcons.tokenList) {
        supportedIconsActions.init();
    }

    const isAvailable = supportedIcons.tokenList?.includes(address);

    if (!isAvailable)
        return (
            <Fallback>
                <CoinLogo size={18} symbol="eth" color={colors.WHITE} />
            </Fallback>
        );

    const tokenUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    return <IconImage src={tokenUrl} />;
};
