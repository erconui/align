// import { Stack } from 'expo-router';
// import '../global.css'; // Import the CSS file
//
// export default function RootLayout() {
//   return (
//     <Stack>
//       <Stack.Screen name="index" options={{ title: 'My Tasks' }} />
//     </Stack>
//   );
// }
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useTaskStore } from '../src/stores/taskStore';

export default function RootLayout() {
  const { init } = useTaskStore();

  useEffect(() => {
    init();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'My Tasks' }} />
      <Stack.Screen name="calendar" options={{ title: 'Calendar' }} />
    </Stack>
  );
}