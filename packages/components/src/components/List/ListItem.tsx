import { useEffect, useRef } from 'react';
import { SpacingValues, spacingsPx, borders } from '@trezor/theme';
import styled, { css } from 'styled-components';
import { FlexAlignItems } from '../Flex/Flex';
import { useList, BulletVerticalAlignment } from './List';

type MapArgs = {
    $bulletAlignment: BulletVerticalAlignment;
};

const mapAlignmentToAlignItems = ({ $bulletAlignment }: MapArgs): FlexAlignItems => {
    const alignItemsMap: Record<BulletVerticalAlignment, FlexAlignItems> = {
        top: 'flex-start',
        center: 'center',
        bottom: 'flex-end',
    };

    return alignItemsMap[$bulletAlignment];
};

type ItemProps = {
    $gap: SpacingValues;
    $bulletAlignment: BulletVerticalAlignment;
};

const Item = styled.li<ItemProps>`
    display: flex;
    align-items: ${({ $bulletAlignment }) => mapAlignmentToAlignItems({ $bulletAlignment })};
    gap: ${({ $gap }) => $gap}px;
`;

const BulletWrapper = styled.div`
    flex: 0;
    position: relative;
`;

const ContentWrapper = styled.div`
    flex: 1;
`;

const Circle = styled.div<{ $isOrdered: boolean }>`
    width: ${spacingsPx.md};
    height: ${spacingsPx.md};
    border-radius: 50%;
    border: ${spacingsPx.xxs} solid ${({ theme }) => theme.backgroundNeutralDisabled};

    ${({ $isOrdered }) =>
        $isOrdered &&
        css`
            position: relative;

            &::before {
                content: '';
                position: absolute;
                top: calc(100% + ${spacingsPx.xs});
                left: 50%;
                transform: translateX(-50%);
                height: calc(var(--distance, 0) - ${spacingsPx.xs});
                border-left: ${borders.widths.large} dashed ${({ theme }) => theme.borderDashed};
            }
        `}
`;

export type ListItemProps = {
    children: React.ReactNode;
    bulletComponent?: React.ReactNode;
};

const calculateDistance = (item: HTMLLIElement | null, circle: HTMLDivElement | null) => {
    const nextItem = item?.nextElementSibling;
    const nextCircle = nextItem?.querySelector(`.${Circle.styledComponentId}`);

    if (circle && nextCircle) {
        const distance =
            nextCircle.getBoundingClientRect().top - circle.getBoundingClientRect().bottom;
        circle?.style.setProperty('--distance', `${distance}px`);
    }
};

export const ListItem = ({ bulletComponent, children }: ListItemProps) => {
    const {
        bulletGap,
        bulletAlignment,
        bulletComponent: listBulletComponent,
        isOrdered,
    } = useList();
    const itemRef = useRef<HTMLLIElement>(null);
    const circleRef = useRef<HTMLDivElement>(null);
    const hasCustomBullet = Boolean(bulletComponent || listBulletComponent);

    useEffect(() => {
        if (hasCustomBullet || !isOrdered || !itemRef.current || !circleRef.current) {
            return;
        }

        const item = itemRef.current;
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        calculateDistance(item, circleRef.current);
                    }
                });
            },
            { threshold: 0.1 },
        );

        if (item) {
            observer.observe(item);
        }

        return () => {
            if (item) {
                observer.unobserve(item);
            }
        };
    }, [itemRef, circleRef, isOrdered, hasCustomBullet]);

    return (
        <Item ref={itemRef} $gap={bulletGap} $bulletAlignment={bulletAlignment}>
            <BulletWrapper>
                {bulletComponent ?? listBulletComponent ?? (
                    <Circle ref={circleRef} $isOrdered={isOrdered} />
                )}
            </BulletWrapper>
            <ContentWrapper>{children}</ContentWrapper>
        </Item>
    );
};
