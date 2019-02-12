import Modal from 'components/Modal';
import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

const ModalContent = styled.div`
    padding: 25px;
`;

storiesOf('Modal', module)
    .addWithJSX('Hello world!', () => (
        <Modal content={<ModalContent>Modal content with padding</ModalContent>} />
    ));
