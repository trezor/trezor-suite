import styled from 'styled-components';

import { H2, Paragraph, variables } from '@trezor/components';

export const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const LeftCol = styled.div`
    display: flex;
    flex: 1 1 calc(100% - 40px);
`;

export const RightCol = styled.div`
    display: flex;
    margin-left: 40px;
    max-width: 280px;
    flex: 1 1 100%;
`;

export const Divider = styled.div`
    width: 100%;
    height: 1px;
    margin: 30px 0;
    background: ${({ theme }) => theme.legacy.STROKE_GREY};
`;

export const ImageWrapper = styled.div`
    top: 50px;
    left: 0;
    right: 0;
`;

export const ButtonWrapper = styled.div`
    display: flex;
    justify-content: center;
    padding-top: 24px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const Title = styled(H2)`
    padding-top: 24px;
    padding-bottom: 12px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const Description = styled(Paragraph)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;
