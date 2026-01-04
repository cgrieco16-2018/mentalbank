import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ValueEventsScreen from "@/screens/ValueEventsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

const Stack = createNativeStackNavigator();

export default function ValueEventsStackNavigator() {
  const { theme, isDark } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: false })}
    >
      <Stack.Screen
        name="ValueEventsMain"
        component={ValueEventsScreen}
        options={{
          headerTitle: "Value Events",
        }}
      />
    </Stack.Navigator>
  );
}
