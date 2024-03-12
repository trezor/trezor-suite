import styled from 'styled-components';

const copy = (data?: string) => {
    const el = document.createElement('textarea');
    el.value = data ?? '';
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

const ClipboardButton = styled.div`
    cursor: pointer;
    position: absolute;
    top: 10px;
    right: 10px;

    svg {
        padding: 0;
        width: 20px;
        height: 100%;
        fill: #000;
        transition: fill 0.3s;
    }

    &:hover {
        svg {
            fill: ${({ theme }) => theme.TYPE_GREEN};
        }
    }
`;

interface CopyToClipboardProps {
    data?: string;
}
export const CopyToClipboard = (props: CopyToClipboardProps) => (
    <ClipboardButton title="Copy to clipboard" onClick={_event => copy(props.data)}>
        <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid">
            <path d="M 5 2 C 3.9 2 3 2.9 3 4 L 3 17 L 5 17 L 5 4 L 15 4 L 15 2 L 5 2 z M 9 6 C 7.9 6 7 6.9 7 8 L 7 20 C 7 21.1 7.9 22 9 22 L 18 22 C 19.1 22 20 21.1 20 20 L 20 8 C 20 6.9 19.1 6 18 6 L 9 6 z M 9 8 L 18 8 L 18 20 L 9 20 L 9 8 z" />
        </svg>
    </ClipboardButton>
);
