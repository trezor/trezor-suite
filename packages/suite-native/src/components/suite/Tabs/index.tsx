import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { BottomTabBarProps } from 'react-navigation-tabs';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    button: {
        // backgroundColor: 'green',
        // width: '40%',
        height: 40,
    },
});

const Tabs = (props: BottomTabBarProps) => {
    const { state, navigate } = props.navigation;

    const onClick = (routeName: string) => {
        const { params } = state.routes[state.index];
        // Preserve only "routeParams", "navigationOptions" will be set from child Tab (<Head />)
        navigate({
            routeName,
            params: {
                routeParams: params && params.routeParams ? params.routeParams : undefined,
            },
        });
    };

    const buttons = props.navigation.state.routes.map(r => (
        <Button key={r.key} title={r.routeName} onPress={() => onClick(r.routeName)} />
    ));

    return <View style={styles.container}>{buttons}</View>;
};

export default Tabs;
