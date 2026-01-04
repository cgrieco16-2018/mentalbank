import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ContractScreen from "@/screens/ContractScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

const Stack = createNativeStackNavigator();

export default function ContractStackNavigator() {
  const { theme, isDark } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: true })}
    >
      <Stack.Screen
        name="ContractMain"
        component={ContractScreen}
        options={{
          headerTitle: "My Contract",
          headerTransparent: true,
          headerBlurEffect: "systemChromeMaterial",
        }}
      />
    </Stack.Navigator>
  );
}
