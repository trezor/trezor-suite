import React from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';

const Wrapper = styled.div``;

const AddLabel = () => (
    <Wrapper>
        <Button variant="tertiary" icon="TAG" onClick={() => {}}>
            <Translation id="RECIPIENT_ADD_LABEL" />
        </Button>
    </Wrapper>
);

export default AddLabel;
