import React from 'react';

import styled from 'styled-components';
import { ThemeProvider } from '@suite-support/ThemeProvider';
import { TorLoader } from '@suite-components';
import { useTor } from '@suite-support/useTor';

import { Modal } from '@trezor/components';

const Wrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const StyledModal = styled(Modal)`
    max-width: 600px;
`;

interface TorLoadingScreenProps {
    callback: (value?: unknown) => void;
}

export const TorLoadingScreen = ({ callback }: TorLoadingScreenProps) => {
    useTor();

    return (
        <ThemeProvider>
            <Wrapper data-test="@tor-loading-screen">
                <TorLoader ModalWrapper={StyledModal} callback={callback} />
            </Wrapper>
        </ThemeProvider>
    );
};
