import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CalendarScreen from "@/screens/CalendarScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

const Stack = createNativeStackNavigator();

export default function CalendarStackNavigator() {
  const { theme, isDark } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: false })}
    >
      <Stack.Screen
        name="CalendarMain"
        component={CalendarScreen}
        options={{
          headerTitle: "History",
        }}
      />
    </Stack.Navigator>
  );
}
