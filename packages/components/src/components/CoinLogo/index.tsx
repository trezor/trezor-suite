/* eslint-disable global-require */
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import AdaCoin from './coins/ada';
import BchCoin from './coins/bch';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    network: string;
    className?: string;
}

const CoinLogo = ({ network, className, ...rest }: Props) => {
    return (
        // eslint-disable-next-line import/no-dynamic-require
        <BchCoin width={32} height={32} />
    );
};

CoinLogo.propTypes = {
    network: PropTypes.string,
    className: PropTypes.string,
};

export default CoinLogo;
