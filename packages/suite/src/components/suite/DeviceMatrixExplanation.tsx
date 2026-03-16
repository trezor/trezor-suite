import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Icon, type IconName, type IconProps, Image, variables } from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';
import { typography } from '@trezor/theme';

import { useGuide } from 'src/hooks/guide';

const Wrapper = styled.div<{ $isGuideOpen?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    background: ${({ theme }) => theme.backgroundNeutralBoldInverted};
    padding: 20px 24px;
    margin-right: 34px;
    width: 100%;
    max-width: 360px;
    border-radius: 5px;

    @media only screen and (max-width: ${props =>
            props.$isGuideOpen ? variables.SCREEN_SIZE.XL : variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const Item = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    flex: 1;
`;

const ItemIconWrapper = styled.div`
    display: flex;
    width: 30px;
    margin-right: 20px;
    justify-content: center;
`;

const ItemText = styled.div`
    width: 100%;
    color: ${({ theme }) => theme.textDefault};
    ${typography['body-sm']}
    padding: 26px 0;
    text-align: left;
`;

interface CommonItemProps {
    key: string;
    title: ReactNode;
}

interface DeviceImageItem extends CommonItemProps {
    deviceModelInternal: DeviceModelInternal;
    icon?: never;
    iconColor?: never;
}

interface IconItem extends CommonItemProps {
    deviceModelInternal?: DeviceModelInternal;
    icon: IconName;
    iconColor?: IconProps['color'];
    iconSize?: IconProps['size'];
}

type Item = DeviceImageItem | IconItem;

interface DeviceMatrixExplanationProps {
    items: Item[];
}

export const DeviceMatrixExplanation = ({ items }: DeviceMatrixExplanationProps) => {
    const { isGuideOpen } = useGuide();

    return (
        <Wrapper $isGuideOpen={isGuideOpen}>
            {items.map(item => (
                <Item key={item.key}>
                    <ItemIconWrapper>
                        {item.icon ? (
                            <Icon
                                name={item.icon}
                                color={item.iconColor}
                                size={item.iconSize ?? 26}
                            />
                        ) : (
                            item.deviceModelInternal && (
                                <Image
                                    alt="Trezor"
                                    image={`TREZOR_${item.deviceModelInternal}`}
                                    height={40}
                                />
                            )
                        )}
                    </ItemIconWrapper>
                    <ItemText>{item.title}</ItemText>
                </Item>
            ))}
        </Wrapper>
    );
};
