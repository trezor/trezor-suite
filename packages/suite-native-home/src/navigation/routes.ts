export enum HomeStackRoutes {
    Home = 'Home',
    HomeDetail = 'HomeDetail',
}

export type HomeStackParamList = {
    [HomeStackRoutes.Home]: undefined;
    [HomeStackRoutes.HomeDetail]: { message: string };
};
