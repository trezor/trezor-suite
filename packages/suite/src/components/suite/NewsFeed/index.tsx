import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { colors, Button, variables } from '@trezor/components-v2';

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
`;

const SectionHeader = styled.div`
    display: flex;
    padding: 12px 0px;
    flex-direction: row;
`;

const SectionTitle = styled.div`
    flex: 1;
    font-size: 12px;
    margin-bottom: 2px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const NewsItem = styled.div`
    display: flex;
    padding: 20px;

    & + & {
        margin-top: 1px solid ${colors.BLACK92};
    }
`;

const Outline = styled.div`
    min-width: 20px;
    display: flex;
`;

const OutlineIcon = styled.div<{ show: boolean }>`
    display: ${props => (props.show ? 'block' : 'none')};
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${colors.BLACK0};
    margin-top: 6px;
    margin-left: 10px;
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
`;

const NewsImage = styled.div`
    width: 80px;
    height: 80px;
    border-radius: 2px;
    background: #f5f5f5;
`;

const NewsTitle = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${props => (props.visited ? variables.FONT_WEIGHT.REGULAR : 500)};
    color: ${props => (props.visited ? colors.BLACK25 : colors.BLACK0)};
    margin-bottom: 2px;
`;

const Timestamp = styled.div<{ visited: boolean }>`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => (props.visited ? colors.BLACK50 : colors.BLACK25)};
    margin-bottom: 5px;
`;

const Description = styled.div<{ visited: boolean }>`
    flex: 1;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => (props.visited ? colors.BLACK50 : colors.BLACK25)};
`;

const CTAWrapper = styled.div``;
const CTAButton = styled(Button)``;

export type Props = React.HTMLAttributes<HTMLDivElement>;

// TODO: Parse real RSS feed https://blog.trezor.io/feed
const NewsFeed = ({ ...rest }: Props) => {
    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>What's new</SectionTitle>
            </SectionHeader>
            <Content>
                <StyledCard>
                    <NewsItem>
                        <Left>
                            <NewsImage />
                        </Left>
                        <Outline>
                            <OutlineIcon show />
                        </Outline>
                        <Right>
                            <NewsTitle visited={false}>TODO: Download a real rss feed</NewsTitle>
                            <Timestamp visited={false}>today</Timestamp>
                            <Description visited={false}>
                                Your coins aren’t in your hardware wallet. But don’t panic! By the
                                time you finish reading this article, you’ll have a better
                                understanding of where your coins are…
                            </Description>
                            <CTAWrapper>
                                <CTAButton size="small" variant="tertiary">
                                    Read more
                                </CTAButton>
                            </CTAWrapper>
                        </Right>
                    </NewsItem>

                    <NewsItem>
                        <Left>
                            <NewsImage />
                        </Left>
                        <Outline>
                            <OutlineIcon show={false} />
                        </Outline>
                        <Right>
                            <NewsTitle visited>Blog: Where in the world are my coins?</NewsTitle>
                            <Timestamp visited>today</Timestamp>
                            <Description visited>
                                Your coins aren’t in your hardware wallet. But don’t panic! By the
                                time you finish reading this article, you’ll have a better
                                understanding of where your coins are…
                            </Description>
                            <CTAWrapper>
                                <CTAButton size="small" variant="tertiary">
                                    Read more
                                </CTAButton>
                            </CTAWrapper>
                        </Right>
                    </NewsItem>
                </StyledCard>
            </Content>
        </Section>
    );
};

export default NewsFeed;
