import { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { zIndices } from '@trezor/theme';

export type ModalAlignment = { x: 'center' | 'left'; y: 'center' | 'top' };

export type BackdropProps = {
    onClick?: () => void;
    children?: ReactNode;
    className?: string;
    alignment?: ModalAlignment;
};

const Wrapper = styled.div<{ $alignment: ModalAlignment }>`
    position: absolute;
    z-index: ${zIndices.modal};
    inset: 0;
    display: flex;
    flex-direction: column;
    overflow: auto;

    /* backdrop-filter does not work in Firefox, use darker background instead */
    backdrop-filter: blur(5px);
    background: rgb(0 0 0 / 30%);

    @supports not ((-webkit-backdrop-filter: blur(5px)) or (backdrop-filter: blur(5px))) {
        background: rgb(0 0 0 / 60%);
    }

    ${({ $alignment }) =>
        $alignment.y === 'center'
            ? css`
                  align-items: center;

                  > :first-child {
                      margin-top: auto;
                  }

                  > :last-child {
                      margin-bottom: auto;
                  }
              `
            : ``}
`;

export const Backdrop = ({
    onClick,
    children,
    className,
    alignment = { x: 'center', y: 'center' },
}: BackdropProps) => (
    <Wrapper onClick={onClick} className={className} $alignment={alignment}>
        {children}
    </Wrapper>
);
