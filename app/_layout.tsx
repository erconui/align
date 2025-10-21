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
        <Stack.Screen name="index" options={{ title: 'Tasks' }} />
        <Stack.Screen name="template" options={{ title: 'Template' }} />
        <Stack.Screen name="template-selector" />
        <Stack.Screen name="calendar" options={{ title: 'Calendar' }} />
    </Stack>
  );
}