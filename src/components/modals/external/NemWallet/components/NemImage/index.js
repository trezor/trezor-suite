/* @flow */

import React from 'react';
import styled from 'styled-components';
import DownloadImg from './images/nem-download.png';

const Img = styled.img`
    display: block;
    width: 100%;
    height: auto;
`;

const NemImage = () => <Img src={DownloadImg} />;

export default NemImage;
