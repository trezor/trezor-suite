import styled from 'styled-components';
import React from 'react';
import {Button} from '@trezor/components';

const Wrapper = styled.div`
    background-color: #AC61D0;
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 1em;
    color: #fff;
`;

interface Props {
    message: string,
    isDismissible?: boolean,
    onDismiss?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

const Announcement = ({message, isDismissible = false, onDismiss = undefined }: Props) => {
    return (
        <Wrapper>
            {message}
            {isDismissible && <Button variant='tertiary' onClick={onDismiss}>Dismiss</Button>}
        </Wrapper>
    );
};

export default Announcement;
