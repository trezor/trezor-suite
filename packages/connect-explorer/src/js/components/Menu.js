import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { push } from 'connected-react-router';
import InfinityMenu from 'react-infinity-menu';
import config from '../data/menu';

const findFiltered = (url, tree, node, key) => {
    node.id = key + 1;
    node.currentUrl = url;
    if (!node.children) {
        node.customComponent = Node;
        if (node.url && node.url === url) {
            node.isOpen = true;
            
            return tree.concat([node]);
        }
        return tree;
    } else {
        const subFolder = node.children.length ? node.children.reduce((p, c, k) => {
            return findFiltered(url, p, c, k);
        }, []) : [];
        node.customComponent = Leaf;
        node.isOpen = subFolder && subFolder.filter(s => s.isOpen).length > 0;
        node.children = node.children;
        return tree.concat([node]);
    }
}

const getTree = (url: string) => {
    // clone config
    const tree = JSON.parse(JSON.stringify(config));
    const filteredTree = tree.reduce((prev, curr, key) => {
        if (key === undefined) return prev;
        return findFiltered(url, prev, curr, key);
    }, []);

    return filteredTree;
}

const Leaf = (props) => {
    const css = props.isOpen ? 'leaf selected' : 'leaf';
    const href = `#${props.data.url}`;
    return (
        <div key={props.data.keyPath} className={css} onClick={props.onClick}>
            <div className="leaf-arrow">
                <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="10" width="10" viewBox="0 0 40 40">
                    <g>
                        <path d="m23.3 20l-13.1-13.6c-0.3-0.3-0.3-0.9 0-1.2l2.4-2.4c0.3-0.3 0.9-0.4 1.2-0.1l16 16.7c0.1 0.1 0.2 0.4 0.2 0.6s-0.1 0.5-0.2 0.6l-16 16.7c-0.3 0.3-0.9 0.3-1.2 0l-2.4-2.5c-0.3-0.3-0.3-0.9 0-1.2z"></path>
                    </g>
                </svg>
            </div>
            {props.name}
        </div>
    );
};

const Node = (props) => {
    const css = props.data.currentUrl === props.data.url ? 'selected' : '';
    const href = `#${props.data.url}`;
    return (
        <a key={props.data.keyPath} className={css} href={href}>
            {props.name}
        </a>
    );
};

class Menu extends Component {

    componentWillMount() {
        this.setState({
            tree: getTree(this.props.location.pathname)
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location !== this.props.location) {
            this.setState({
                tree: getTree(this.props.location.pathname)
            });
        }
    }

    onNodeMouseClick(event, tree, node, level, keyPath) {
        this.setState({
            tree: tree
        });
    }

    render() {
        return (
            <InfinityMenu
                tree={this.state.tree}
                disableDefaultHeaderContent={true}
                onNodeMouseClick={this.onNodeMouseClick.bind(this)}
            />
        );
    }
    
}

export default withRouter(Menu);