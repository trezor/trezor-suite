import styled from 'styled-components';

import { Paragraph } from '@trezor/components';
import { Loading } from 'src/components/suite';
import { ThemeProvider } from '../ThemeProvider';

const Wrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const Loader = styled(Loading)`
    display: block;
    margin: 0;
    flex: 0;
`;

const LoadingText = styled(Paragraph)`
    height: 0;
`;

type LoadingScreenProps = {
    message?: string;
};

export const LoadingScreen = ({ message }: LoadingScreenProps) => (
    <ThemeProvider>
        <Wrapper>
            <Loader />
            <LoadingText>{message}</LoadingText>
        </Wrapper>
    </ThemeProvider>
);
