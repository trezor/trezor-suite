import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import InfinityMenu from 'react-infinity-menu';
import { createGlobalStyle } from 'styled-components';

import config from '../data/menu';

const Style = createGlobalStyle`
.infinity-menu-container {
    width: 25%;
    min-width: 200px;
    max-width: 300px;
    padding: 10px;
}

.infinity-menu-container a {
    position: relative;
    display: block;
    cursor: pointer;
    padding: 6px 0;
    color: rgb(117 117 117);
    border-color: @color_green;
    transition: color 0.3s;

    &.selected {
        color: @color_green;
    }
}

.infinity-menu-node-container {
    cursor: pointer;
    padding: 10px 15px;
    transition: all 0.5s;

    &:hover {
        background: linear-gradient(to right, rgb(255 255 255 / 0%) 0%,rgb(255 255 255 / 40%) 100%);
    }
}

.infinity-menu-display-tree-container ul {
    display: block;
    list-style-type: none;
    padding-left: 16px;
}

.infinity-menu-display-tree-container .leaf-arrow {
    line-height: 10px;
    width: 10px;
    height: 10px;
    margin: 0 6px 0 0;
    transition: all 1s;

    svg {
        vertical-align: top;
        fill: currentcolor;
    }
}

.infinity-menu-display-tree-container .leaf {
    display: flex;
    align-items: center;
    line-height: 18px;
    padding: 4px 0;
    color: rgb(73 73 73);
    cursor: pointer;

    &.selected {
        .leaf-arrow {
            transform: rotateZ(90deg);
        }
    }
}
`;

interface NodeProps {
    name: string;
    data: {
        url: string;
        currentUrl: string;
        keyPath: string;
    };
}

const Node = ({ data, name }: NodeProps) => {
    const css = data.currentUrl === data.url ? 'selected' : '';
    const href = data.url;
    return (
        <a key={data.keyPath} className={css} href={`#${href}`}>
            {name}
        </a>
    );
};

interface LeafProps extends NodeProps {
    onClick: () => void;
    isOpen: boolean;
}

const Leaf = ({ data, isOpen, name, onClick }: LeafProps) => {
    const css = isOpen ? 'leaf selected' : 'leaf';
    return (
        <div key={data.keyPath} className={css} onClick={onClick}>
            <div className="leaf-arrow">
                <svg
                    fill="currentColor"
                    preserveAspectRatio="xMidYMid meet"
                    height="10"
                    width="10"
                    viewBox="0 0 40 40"
                >
                    <g>
                        <path d="m23.3 20l-13.1-13.6c-0.3-0.3-0.3-0.9 0-1.2l2.4-2.4c0.3-0.3 0.9-0.4 1.2-0.1l16 16.7c0.1 0.1 0.2 0.4 0.2 0.6s-0.1 0.5-0.2 0.6l-16 16.7c-0.3 0.3-0.9 0.3-1.2 0l-2.4-2.5c-0.3-0.3-0.3-0.9 0-1.2z" />
                    </g>
                </svg>
            </div>
            {name}
        </div>
    );
};

const findFiltered = (url: any, tree: any, node: any, key: any) => {
    node.id = key + 1;
    node.currentUrl = url;
    if (!node.children) {
        node.customComponent = Node;
        if (node.url && node.url === url) {
            // window.location = `#/${url};
            node.isOpen = true;
            return tree.concat([node]);
        }
        return tree;
    }
    const subFolder = node.children.length
        ? node.children.reduce((p, c, k) => findFiltered(url, p, c, k), [])
        : [];

    node.customComponent = Leaf;
    node.isOpen = subFolder && subFolder.filter(s => s.isOpen).length > 0;
    return tree.concat([node]);
};

const getTree = (url: string) => {
    // clone config
    const tree = JSON.parse(JSON.stringify(config));
    const filteredTree = tree.reduce((prev, curr, key) => {
        if (key === undefined) return prev;
        return findFiltered(url, prev, curr, key);
    }, []);

    return filteredTree;
};

export const Menu = () => {
    const location = useLocation();
    const [tree, setTree] = useState<any>();

    useEffect(() => {
        const tree = getTree(location.pathname);
        setTree(tree);
    }, [location]);

    const onNodeMouseClick = (_event, tree, _node) => {
        setTree([...tree]);
    };

    return (
        <>
            <Style />
            <InfinityMenu
                tree={tree}
                disableDefaultHeaderContent
                onNodeMouseClick={onNodeMouseClick}
            />
        </>
    );
};
