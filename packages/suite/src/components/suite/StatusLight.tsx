import styled from 'styled-components';

type Status = 'ok' | 'warning' | 'error';

const Circle = styled.div<{ status: Status }>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${({ status, theme }) =>
        status === 'ok' ? theme.BG_LIGHT_GREEN : theme.BG_LIGHT_RED};
    & > div {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: ${({ status, theme }) => {
            switch (status) {
                case 'ok':
                    return theme.TYPE_GREEN;
                case 'warning':
                    return theme.TYPE_ORANGE;
                case 'error':
                default:
                    return theme.TYPE_RED;
            }
        }};
    }
`;

interface StatusLightProps {
    status: Status;
    className?: string;
}

export const StatusLight = ({ status, className }: StatusLightProps) => (
    <Circle status={status} className={className}>
        <div />
    </Circle>
);
