import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LedgerScreen from "@/screens/LedgerScreen";
import AddValueEventScreen from "@/screens/AddValueEventScreen";
import AddRealityIncomeScreen from "@/screens/AddRealityIncomeScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

const Stack = createNativeStackNavigator();

export default function LedgerStackNavigator() {
  const { theme, isDark } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: true })}
    >
      <Stack.Screen
        name="LedgerMain"
        component={LedgerScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Mental Bank" />,
          headerTransparent: true,
          headerBlurEffect: "systemChromeMaterial",
        }}
      />
      <Stack.Screen
        name="AddValueEvent"
        component={AddValueEventScreen}
        options={{
          presentation: "modal",
          headerTitle: "Log Value Event",
        }}
      />
      <Stack.Screen
        name="AddRealityIncome"
        component={AddRealityIncomeScreen}
        options={{
          presentation: "modal",
          headerTitle: "Reality Income",
        }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          headerTitle: "History",
        }}
      />
    </Stack.Navigator>
  );
}
