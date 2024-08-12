import styled from 'styled-components';
import { Spinner } from '@trezor/components';

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
    <LoaderWrapper data-testid="@suite/loading" className={className}>
        <Spinner size={80} isGrey={false} hasStartAnimation={true} />
    </LoaderWrapper>
);
