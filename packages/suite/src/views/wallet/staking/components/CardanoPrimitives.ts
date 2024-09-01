import { H2 } from '@trezor/components';
import { borders, typography } from '@trezor/theme';
import styled from 'styled-components';

export const Heading = styled.div`
    padding-left: 5px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
export const StyledH2 = styled(H2)`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 5px;
`;

export const Row = styled.div`
    display: flex;
    width: 100%;
    margin-top: 24px;
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    max-width: 100%;
`;

export const Title = styled.div`
    display: flex;
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    ${typography.highlight}
    align-items: center;
    margin-bottom: 16px;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    margin-top: 24px;
    justify-content: center;
`;

export const Text = styled.div`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    margin-bottom: 8px;
    margin-top: 8px;
    ${typography.hint}
`;

export const Content = styled.div`
    display: flex;
    overflow: hidden;
    padding-left: 10px;
    margin-left: -10px;
    width: 100%;
`;

export const Value = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-variant-numeric: tabular-nums slashed-zero;
    width: fit-content;
    background: ${({ theme }) => theme.legacy.BG_LIGHT_GREY};
    border: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    border-radius: ${borders.radii.xs};
    word-break: break-all;
    padding: 10px;
`;
