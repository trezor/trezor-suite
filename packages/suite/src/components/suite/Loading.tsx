import styled from 'styled-components';
import { Image } from '@trezor/components';

const LoaderWrapper = styled.div`
    margin: auto;
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

type LoadingProps = {
    className?: string;
};

export const Loading = ({ className }: LoadingProps) => (
    <LoaderWrapper data-test="@suite/loading" className={className}>
        <Image width={80} height={80} image="SPINNER" />
    </LoaderWrapper>
);
