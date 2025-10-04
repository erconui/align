import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 p-4">
      <Text className="text-3xl font-bold text-gray-900 mb-8">
        Tasks App
      </Text>

      <View className="w-full max-w-sm space-y-4">
        <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-lg shadow-sm">
          <Text className="text-white text-center font-semibold text-lg">
            Add New Task
          </Text>
        </TouchableOpacity>

        <Link href="/calendar" asChild>
          <TouchableOpacity className="bg-green-500 px-6 py-3 rounded-lg">
            <Text className="text-white text-center font-semibold">
              Go to Calendar
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}