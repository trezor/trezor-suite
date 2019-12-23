import FirmwareUpdate from '@suite-components/FirmwareUpdate';

import React from 'react';
import styled from 'styled-components';

const TempWrap = styled.div`
    width: 600px;
    height: 400px;
    border: 1px dashed grey;
`;

export default () => (
    <TempWrap>
        <FirmwareUpdate />
    </TempWrap>
);
