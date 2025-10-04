import { Stack } from 'expo-router';
import '../global.css'; // Import the CSS file

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'My Tasks' }} />
    </Stack>
  );
}