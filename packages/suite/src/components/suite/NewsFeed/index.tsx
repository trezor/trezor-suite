import React from 'react';
import styled from 'styled-components';
import Card from '@suite-components/Card';
import { colors, Button, variables } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
// import parser from 'fast-xml-parser';

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

// const stripHTML = (html: string) => {
//     const doc = new DOMParser().parseFromString(html, 'text/html');
//     return doc.body.textContent || '';
// };

// TODO: state logic for read/unread articles
// TODO: Parse real RSS feed https://blog.trezor.io/feed
// 0. convert xml to json (fast-xml-parser) works fine
// 1. download the rss feed using a proxy server because of cors
// 2. images for articles are not provided (could be parsed from the article's html)
// 3. content of an article is provided only as html, need to strip html tags to show something reasonable
// 4. content of an article includes the author and and date which will need to be removed
const NewsFeed = React.memo(({ ...rest }: Props) => {
    // const [items, setItems] = useState<any[]>([]);
    // const [error, setError] = useState<string | null>(null);

    // useEffect(() => {
    //     const fetchBlogFeed = async () => {
    //         const response = await fetch(
    //             'https://cors-anywhere.herokuapp.com/https://blog.trezor.io/feed',
    //         ); // TODO: custom proxy
    //         if (!response.ok) setError(response.statusText);
    //         if (response.body) {
    //             const xmlData = await response.text();
    //             const result = parser.parse(xmlData);
    //             console.log(result);
    //             setItems(result.rss.channel.item);
    //         }
    //     };
    //     fetchBlogFeed();
    // }, []);

    return (
        <Section {...rest}>
            <SectionHeader>
                <SectionTitle>
                    <Translation {...messages.TR_WHATS_NEW} />
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
                        <Translation {...messages.TR_MARK_ALL_AS_READ} />
                    </Button>
                </SectionAction>
            </SectionHeader>
            <Content>
                <StyledCard>
                    {/* {items.map(item => (
                        <NewsItem>
                            <Left>
                                <NewsImage />
                            </Left>
                            <Outline>
                                <OutlineIcon show />
                            </Outline>
                            <Right>
                                <NewsTitle visited={false}>{item.title}</NewsTitle>
                                <Timestamp visited={false}>{item.pubDate}</Timestamp>
                                <Description visited={false}>
                                    {stripHTML(item['content:encoded'])}
                                </Description>
                                <CTAWrapper>
                                    <CTAButton size="small" variant="tertiary">
                                        Read more
                                    </CTAButton>
                                </CTAWrapper>
                            </Right>
                        </NewsItem>
                    ))} */}
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
                                    <Translation {...messages.TR_READ_MORE} />
                                </CTAButton>
                            </CTAWrapper>
                        </Right>
                    </NewsItem>
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
                    <Translation {...messages.TR_SHOW_OLDER_NEWS} />
                </Button>
            </BottomAction>
        </Section>
    );
});

export default NewsFeed;
