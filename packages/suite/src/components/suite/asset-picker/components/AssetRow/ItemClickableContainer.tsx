import { GhostContainer, type Padding, Row } from '@trezor/components';

import { ASSET_ROW_HEIGHT } from '../../constants';

type ItemClickableContainerProps = {
    children: React.ReactNode;
    onClick: () => void;
    padding?: Padding;
    isDisabled?: boolean;
};

export function ItemClickableContainer({
    children,
    onClick,
    padding = {
        left: 8,
        vertical: 8,
        right: 12,
    },
    isDisabled = false,
}: ItemClickableContainerProps) {
    return (
        <GhostContainer
            width="100%"
            height={ASSET_ROW_HEIGHT - 8}
            padding={padding}
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
            isDisabled={isDisabled}
            cursor={isDisabled ? 'not-allowed' : 'pointer'}
        >
            <Row justifyContent="space-between" gap={12} height="100%">
                {children}
            </Row>
        </GhostContainer>
    );
}
