import React from 'react';
import styled from 'styled-components';
import { DeviceImage, Icon, IconProps, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    background: ${props => props.theme.BG_GREY};
    padding: 20px 24px;
    margin-right: 34px;
    width: 100%;
    max-width: 360px;
    border-radius: 5px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
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
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 26px 0px;
    text-align: left;
`;

interface CommonItemProps {
    key: string;
    title: React.ReactNode;
}

interface DeviceImageItem extends CommonItemProps {
    deviceImage: 1 | 2;
    icon?: never;
    iconColor?: never;
}

interface IconItem extends CommonItemProps {
    deviceImage?: never;
    icon: IconProps['icon'];
    iconColor?: IconProps['color'];
    iconSize?: IconProps['size'];
}

type Item = DeviceImageItem | IconItem;

interface Props {
    items: Item[];
}

const DeviceMatrixExplanation = ({ items }: Props) => (
    <Wrapper>
        {items.map(item => (
            <Item key={item.key}>
                <ItemIconWrapper>
                    {item.icon ? (
                        <Icon icon={item.icon} color={item.iconColor} size={item.iconSize ?? 26} />
                    ) : (
                        <DeviceImage trezorModel={item.deviceImage} height={40} />
                    )}
                </ItemIconWrapper>
                <ItemText>{item.title}</ItemText>
            </Item>
        ))}
    </Wrapper>
);

export default DeviceMatrixExplanation;
