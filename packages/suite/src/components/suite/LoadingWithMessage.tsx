import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Column, Text } from '@trezor/components';

import { Loading } from './Loading';

const SpinnerOnly = styled(Loading)`
    flex: none;
    margin: 0;
`;

type LoadingWithMessageProps = {
    message?: ReactNode;
};

export const LoadingWithMessage = ({ message }: LoadingWithMessageProps) => (
    <Column flex="1" height="100%" alignItems="center" justifyContent="center" gap={16}>
        <SpinnerOnly />
        {message && (
            <Text intent="neutral" priority="secondary" align="center">
                {message}
            </Text>
        )}
    </Column>
);
