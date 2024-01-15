import { useLoadingSkeleton } from 'src/hooks/suite';
import { Left, Right } from './AccountItem';
import { NavigationItemBase } from 'src/components/suite/Preloader/SuiteLayout/Sidebar/NavigationItem';
import {
    SkeletonCircle,
    SkeletonStack,
    SkeletonRectangle,
    SkeletonElevation,
} from '@trezor/components';

interface AccountItemSkeletonProps {
    animate?: boolean;
    elevation?: SkeletonElevation;
}

export const AccountItemSkeleton = (props: AccountItemSkeletonProps) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animate = props.animate ?? shouldAnimate;
    return (
        <NavigationItemBase>
            <Left>
                <SkeletonCircle elevation={props.elevation} size="18px" />
            </Left>
            <Right>
                <SkeletonStack col childMargin="0px 0px 8px 0px">
                    <SkeletonRectangle
                        elevation={props.elevation}
                        width="180px"
                        height="20px"
                        animate={animate}
                    />

                    <SkeletonRectangle
                        elevation={props.elevation}
                        width="100px"
                        height="16px"
                        animate={animate}
                    />

                    <SkeletonRectangle
                        elevation={props.elevation}
                        width="100px"
                        height="16px"
                        animate={animate}
                    />
                </SkeletonStack>
            </Right>
        </NavigationItemBase>
    );
};
