export enum HomeStackRoutes {
    Home = 'Home',
    HomeDemo = 'HomeDemo',
}

export type HomeStackParamList = {
    [HomeStackRoutes.Home]: undefined;
    [HomeStackRoutes.HomeDemo]: { message: string };
};
