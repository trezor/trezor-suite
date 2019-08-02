import React from 'react';
import styled from 'styled-components/native';
import {
    colors,
    Prompt,
    H1,
    H5,
    Icon,
    Loader,
    TrezorLogo,
    TrezorImage,
    CoinLogo,
    variables,
} from '@trezor/components';

const { FONT_SIZE_NATIVE } = variables;

const Wrapper = styled.View`
    padding: 10px;
`;

const Col = styled.View`
    flex-direction: column;
`;

const Section = styled.View`
    flex: 1;
    justify-content: center;
    align-items: center;
`;

const SectionDark = styled(Section)`
    background: ${colors.HEADER};
`;

const Icons = styled.View`
    flex: 1;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    padding: 16px;
`;

const Item = styled.View`
    flex: 1;
    flex-basis: 33%;
    justify-content: center;
    align-items: center;
    padding: 0 0 10px;
`;

const Title = styled.Text`
    color: ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE_NATIVE.SMALL};
    margin-bottom: 8px;
`;

const { COINS, ICONS } = variables;

const Other = () => {
    return (
        <Wrapper>
            <H1>Icons</H1>
            <Icons>
                {ICONS.map((icon: string) => {
                    return (
                        <Item key={icon}>
                            <Title>{icon}</Title>
                            <Icon size={32} icon={icon} />
                        </Item>
                    );
                })}
            </Icons>

            <H1>Coins</H1>
            <Icons>
                {COINS.map((coin: string) => {
                    return (
                        <Item key={coin}>
                            <Title>{coin}</Title>
                            <CoinLogo size={64} network={coin} />
                        </Item>
                    );
                })}
            </Icons>
            <H1>Prompt</H1>
            <H5>Trezor One</H5>
            <Section>
                <Prompt model={1} data-test="prompt_1">
                    Complete the action on your device
                </Prompt>
            </Section>

            <H5>Trezor Model T</H5>
            <Section>
                <Prompt model={2} data-test="prompt_2">
                    Complete the action on your device
                </Prompt>
            </Section>

            <H1>TrezorImage</H1>
            <H5>Trezor One</H5>
            <Col>
                <TrezorImage height={310} model={1} data-test="trezor_image_1" />
            </Col>

            <H5>Trezor Model T</H5>
            <Col>
                <TrezorImage height={310} model={2} data-test="trezor_image_2" />
            </Col>

            <H1>TrezorLogo</H1>
            <H5>Horizontal</H5>
            <Section>
                <TrezorLogo type="horizontal" height={50} data-test="trezor_logo_horizontal" />
            </Section>

            <H5>Vertical</H5>
            <Section>
                <TrezorLogo type="vertical" height={100} data-test="trezor_logo_vertical" />
            </Section>

            <H1>Loader</H1>
            <H5>default</H5>
            <Section>
                <Loader size={100} strokeWidth={2} text="loading" data-test="loader_default" />
            </Section>

            <H5>small text</H5>
            <Section>
                <Loader
                    size={100}
                    strokeWidth={2}
                    text="loading"
                    isSmallText
                    data-test="loader_small_text"
                />
            </Section>

            <H5>transparent route</H5>
            <Section>
                <Loader
                    size={100}
                    strokeWidth={2}
                    text="loading"
                    transparentRoute
                    data-test="loader_transparent_route"
                />
            </Section>

            <H5>white text</H5>
            <SectionDark>
                <Loader
                    size={100}
                    strokeWidth={2}
                    text="loading"
                    isWhiteText
                    data-test="loader_white_text"
                />
            </SectionDark>

            <H5>white text &amp; transparent route</H5>
            <SectionDark>
                <Loader
                    size={100}
                    strokeWidth={2}
                    text="loading"
                    isWhiteText
                    transparentRoute
                    data-test="loader_white_text_transparent"
                />
            </SectionDark>
        </Wrapper>
    );
};

export default Other;
