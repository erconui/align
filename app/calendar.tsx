import { View, Text } from 'react-native';
import { Link } from 'expo-router';

export default function CalendarScreen() {
  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-4">
        Calendar View
      </Text>
      <Text className="text-gray-600 mb-4">
        NativeWind v4 is working!
      </Text>

      <Link href="/" className="text-blue-500 font-medium">
        ← Back to Tasks
      </Link>
    </View>
  );
}