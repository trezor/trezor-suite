import styled from 'styled-components';

import { variables } from '@trezor/components';
import {
    GuideHeader,
    GuideContent,
    GuideViewWrapper,
    GuideNode,
    GuideCategories,
} from 'src/components/guide';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { setView } from 'src/actions/suite/guideActions';
import { getNodeTitle } from 'src/utils/suite/guide';

const Section = styled.div`
    margin-bottom: 20px;

    &:not(:last-of-type) {
        margin-bottom: 100px;
    }
`;

const SectionHeading = styled.h3`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding: 8px 0 18px;
`;

const Nodes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

export const GuideCategory = () => {
    const currentNode = useSelector(state => state.guide.currentNode);
    const language = useSelector(state => state.suite.settings.language);
    const dispatch = useDispatch();

    if (!currentNode || currentNode.type === 'page') {
        return null;
    }

    const title = getNodeTitle(currentNode, language);

    // Right now we support only 2 levels of categories
    // Level 1 category has its own view
    // Level 2 category is part of level 1 category view
    const pages = currentNode.children.filter(child => child.type === 'page');
    const subcategories = currentNode.children.filter(child => child.type === 'category');

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));

    return (
        <GuideViewWrapper>
            <GuideHeader back={goBack} label={title} />
            <GuideContent>
                {pages.length ? (
                    <Section>
                        <SectionHeading>
                            <Translation id="TR_GUIDE_ARTICLES" />
                        </SectionHeading>
                        <Nodes data-test="@guide/nodes">
                            {pages.map(page => (
                                <GuideNode key={page.id} node={page} />
                            ))}
                        </Nodes>
                    </Section>
                ) : null}
                {subcategories.length
                    ? subcategories.map(subcategory =>
                          subcategory.type === 'category' ? (
                              <GuideCategories
                                  key={subcategory.id}
                                  node={subcategory}
                                  label={getNodeTitle(subcategory, language)}
                              />
                          ) : null,
                      )
                    : null}
            </GuideContent>
        </GuideViewWrapper>
    );
};
