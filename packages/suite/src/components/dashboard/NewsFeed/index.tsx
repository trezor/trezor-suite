import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { colors, Button, variables } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

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
    justify-content: space-between;
    align-items: center;
`;

const SectionTitle = styled.div`
    flex: 1;
    font-size: 12px;
    margin-bottom: 2px;
    font-weight: 600;
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const SectionAction = styled.div`
    font-size: 12px;
    font-weight: 500;
    color: ${colors.BLACK25};
`;

const BottomAction = styled.div`
    display: flex;
    margin-top: 13px;
    font-size: 12px;
    font-weight: 500;
    justify-content: center;
    color: ${colors.BLACK25};
`;

const NewsItem = styled.div`
    display: flex;
    padding: 20px;

    & + & {
        margin-top: 1px solid ${colors.BLACK92};
    }
`;

const Left = styled.div`
    display: flex;
`;

const Right = styled.div`
    display: flex;
    padding-left: 16px;
    flex-direction: column;
`;

const NewsImage = styled.img`
    width: 80px;
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

const CTAWrapper = styled.a``;
const CTAButton = styled(Button)``;

export type Props = React.HTMLAttributes<HTMLDivElement>;

const NewsFeed = React.memo(({ ...rest }: Props) => {
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        setItems([
            {
                title:
                    'Gift yourself…anything! Use your Trezor to buy gift cards from around the world.',
                thumbnail: 'https://cdn-images-1.medium.com/max/1024/1*0yuYSkoDM901kMqDNySzhg.jpeg',
                pubDate: '2020-03-11 17:08:43',
                link:
                    'https://blog.trezor.io/gift-yourself-anything-use-your-trezor-to-buy-gift-cards-from-around-the-world-20f5051acf60?source=rss-b8686215a986------2',
                description:
                    'Most of you have probably heard this ‘gotcha’ from your nocoiner friends, colleagues, and relatives in the past. The good news is, the answer is very straightforward; yes, you can buy everything with bitcoin. The options had been there for a long time, and now it is easier than ever.',
            },
            {
                title: 'The Economics of Halving: What Will Happen to the Price?',
                thumbnail: 'https://cdn-images-1.medium.com/max/1024/1*0wmHo0Di1nAco9_9LBDXXg.jpeg',
                pubDate: '2020-02-20 16:56:59',
                link:
                    'https://blog.trezor.io/the-economics-of-halving-what-will-happen-to-the-price-dab6df11755a?source=rss-b8686215a986------2',
                description:
                    'Bitcoin is circling $10,000 again, and of course, you are wondering what will happen next. 2020 is a special year for Bitcoin in many ways. One of them is even written by Satoshi Nakamoto himself into its DNA — yes, the halving. The next halving is estimated to occur on 12 May 2020, so let’s take a closer look at what will happen afterwards.',
            },
            {
                title:
                    'Almost all of the Secure Element microchip manufacturers require non-disclosure agreements to be…',
                thumbnail:
                    'https://medium.com/_/stat?event=post.clientViewed&referrerSource=full_rss&postId=c97c743457d5',
                pubDate: '2020-01-31 15:14:02',
                link:
                    'https://medium.com/@satoshilabs/almost-all-of-the-secure-element-microchip-manufacturers-require-non-disclosure-agreements-to-be-c97c743457d5?source=rss-b8686215a986------2',
                description:
                    'Almost all of the Secure Element microchip manufacturers require non-disclosure agreements to be signed, meaning that the hardware wallet manufactures using these chips in their devices might be prevented from publicly disclosing any discovered flaws or backdoors in the hardware. We’re currently looking into multiple chips on the market that could be used in the next generation of Trezor devices.',
            },
            {
                title: 'Our Response to the Read Protection Downgrade Attack',
                thumbnail: 'https://cdn-images-1.medium.com/max/1024/1*08VFZOY7rd6BRF7pMSUaNQ.png',
                pubDate: '2020-01-31 14:39:10',
                link:
                    'https://blog.trezor.io/our-response-to-the-read-protection-downgrade-attack-28d23f8949c6?source=rss-b8686215a986------2',
                description:
                    'This article addresses the Read Protection (RDP) Downgrade attack discovered in both Trezor One and Trezor Model T by the Kraken Security Labs researchers on 30 October 2019. Here you can find information about how this physical attack works and how you can protect yourself against it if you’re concerned that you might be affected. In the second part of the article, we explain our threat model and say a few things about physical security.',
            },
        ]);
    }, []);

    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>
                    <Translation id="TR_WHATS_NEW" />
                </SectionTitle>
                <SectionAction>
                    <Button
                        variant="tertiary"
                        size="small"
                        icon="CHECK"
                        onClick={() => {
                            console.log('do something');
                        }}
                    >
                        <Translation id="TR_MARK_ALL_AS_READ" />
                    </Button>
                </SectionAction>
            </SectionHeader>
            <Content>
                <StyledCard>
                    {items.map(item => (
                        <NewsItem>
                            <Left>
                                <NewsImage src={item.thumbnail} />
                            </Left>
                            <Right>
                                <NewsTitle visited={false}>{item.title}</NewsTitle>
                                <Timestamp visited={false}>{item.pubDate}</Timestamp>
                                <Description visited={false}>{item.description}</Description>
                                <CTAWrapper href={item.link}>
                                    <CTAButton size="small" variant="tertiary">
                                        Read more
                                    </CTAButton>
                                </CTAWrapper>
                            </Right>
                        </NewsItem>
                    ))}
                </StyledCard>
            </Content>
            <BottomAction>
                <Button
                    variant="tertiary"
                    size="small"
                    icon="ARROW_DOWN"
                    onClick={() => {
                        console.log('do something');
                    }}
                >
                    <Translation id="TR_SHOW_OLDER_NEWS" />
                </Button>
            </BottomAction>
        </Section>
    );
});

export default NewsFeed;
