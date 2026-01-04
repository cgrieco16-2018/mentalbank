import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { Spacing } from "@/constants/theme";

interface UseScreenInsetsParams {
  transparentHeader?: boolean;
  noTabBar?: boolean;
}

export function useScreenInsets(params?: UseScreenInsetsParams) {
  const { transparentHeader = false, noTabBar = false } = params || {};
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  const top = transparentHeader ? headerHeight + Spacing.xl : Spacing.xl;
  const bottom = noTabBar
    ? insets.bottom + Spacing.xl
    : tabBarHeight + Spacing.xl;

  return {
    top,
    bottom,
    paddingTop: top,
    paddingBottom: bottom,
    scrollInsetBottom: insets.bottom + 16,
  };
}
