import styled from 'styled-components';

import { Text, Tooltip } from '@trezor/components';

const Content = styled.div`
    margin: 4px;
    overflow: hidden;
`;

const Circle = styled.div<{ $size: number }>`
    border-radius: calc(infinity * 1px);
    align-items: center;
    justify-content: center;
    display: flex;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    border: solid 1px ${({ theme }) => theme.elementBorderNeutralSofter};
    background-color: ${({ theme }) => theme.elementFillElevated};
`;
type TokenInitialsProps = {
    children: string;
    withTooltip?: boolean;
    size: number;
};

const TokenInitialsInner = ({ children, size, withTooltip = true }: TokenInitialsProps) => {
    const firstChar = children[0];

    return (
        <Circle $size={size}>
            <Content>
                {withTooltip ? (
                    <Tooltip content={children}>
                        <Text typographyStyle="body-sm-strong">{firstChar}</Text>
                    </Tooltip>
                ) : (
                    <Text typographyStyle="body-sm-strong">{firstChar}</Text>
                )}
            </Content>
        </Circle>
    );
};

export const TokenInitials = ({ children, ...rest }: TokenInitialsProps) => (
    <TokenInitialsInner {...rest}>{children}</TokenInitialsInner>
);
