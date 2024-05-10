import styled from 'styled-components';

const Pre = styled.pre`
    line-break: anywhere;
    white-space: break-spaces;
`;

export const PreField = ({ children }: { children: string }) => <Pre>{children}</Pre>;
