import React, { useState } from 'react';
import styled from 'styled-components';
import TextTruncate from 'react-text-truncate';
import { Translation } from '@suite-components';
import { colors, Button, variables } from '@trezor/components';
import { useFetchNews } from '@dashboard-hooks/useNews';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 64px;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 25px;
`;

const Left = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.H2};
`;

const Right = styled.div``;

const Posts = styled.div`
    display: grid;
    grid-gap: 30px;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    width: 100%;
    flex-direction: column;
`;

const BottomAction = styled.div`
    display: flex;
    margin-top: 28px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    justify-content: center;
    color: ${colors.BLACK25};
`;

const Content = styled.div`
    padding: 4px;
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Post = styled.div`
    display: flex;
    padding: 6px;
    flex-direction: column;
    background: ${colors.WHITE};
    border-radius: 3px;
`;

const Image = styled.img`
    width: 100%;
    height: 195px;
    border-radius: 3px;
    object-fit: cover;
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding: 14px 0 8px 0;
    min-height: 62px;
`;

const Description = styled.div`
    display: flex;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const ReadMore = styled.a`
    display: flex;
    align-self: flex-start;
    color: ${colors.BLACK17};
    margin: 10px 0 0 0;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const MediumLink = styled.a``;

const NewsFeed = () => {
    const [visibleCount, incrementVisibleCount] = useState(3);
    const { posts, isError, fetchCount, incrementFetchCount } = useFetchNews();

    if (isError) return null;

    return (
        <Wrapper>
            <Header>
                <Left>
                    <Translation id="TR_WHATS_NEW" />
                </Left>
                <Right>
                    <MediumLink target="_blank" href="https://blog.trezor.io/">
                        <Button isWhite variant="tertiary" icon="MEDIUM">
                            <Translation id="TR_OPEN_IN_MEDIUM" />
                        </Button>
                    </MediumLink>
                </Right>
            </Header>
            <Posts>
                {posts.slice(0, visibleCount).map(item => (
                    <Post key={item.link}>
                        <Image src={item.thumbnail} />
                        <Content>
                            <Title>
                                <TextTruncate
                                    line={2}
                                    element="div"
                                    truncateText="…"
                                    text={item.title}
                                />
                            </Title>
                            <Description>
                                <TextTruncate
                                    line={3}
                                    element="div"
                                    truncateText="…"
                                    text={item.description}
                                />
                            </Description>
                            <ReadMore target="_blank" href={item.link}>
                                <Button
                                    variant="tertiary"
                                    alignIcon="right"
                                    color={colors.BLACK0}
                                    icon="EXTERNAL_LINK"
                                >
                                    <Translation id="TR_READ_MORE" />
                                </Button>
                            </ReadMore>
                        </Content>
                    </Post>
                ))}
            </Posts>
            {posts.length > visibleCount && (
                <BottomAction>
                    <Button
                        variant="tertiary"
                        isWhite
                        onClick={() => {
                            incrementVisibleCount(visibleCount + 3);
                            incrementFetchCount(fetchCount + 3);
                        }}
                    >
                        <Translation id="TR_SHOW_OLDER_NEWS" />
                    </Button>
                </BottomAction>
            )}
        </Wrapper>
    );
};

export default NewsFeed;
