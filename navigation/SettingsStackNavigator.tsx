import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "@/screens/SettingsScreen";
import AffirmationsScreen from "@/screens/AffirmationsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

const Stack = createNativeStackNavigator();

export default function SettingsStackNavigator() {
  const { theme, isDark } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: false })}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          headerTitle: "Settings",
        }}
      />
      <Stack.Screen
        name="Affirmations"
        component={AffirmationsScreen}
        options={{
          headerTitle: "Affirmations Library",
        }}
      />
    </Stack.Navigator>
  );
}
