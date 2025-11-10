import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

export default function SettingScreen() {
  const {
    initDB
  } = useTaskStore();
  const { colors, styles, toggleTheme, theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Settings
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {/* Theme Setting */}
        <View style={styles.settingsRow}>
          <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>Color Theme:</Text>
          <Pressable onPress={toggleTheme} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>{theme}</Text>
          </Pressable>
        </View>

        {/* Database Setting */}
        <View style={styles.settingsRow}>
          <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>Database</Text>
          <Pressable onPress={initDB} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>Initialize</Text>
          </Pressable>
        </View>
        <View style={styles.settingsRow}>
          <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>Import Database</Text>
          <Pressable onPress={() => console.log("Need to implement")} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>Import</Text>
          </Pressable>
          <Pressable onPress={() => console.log("Need to implement")} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
            <Text style={{ color: colors.text, fontWeight: '500' }}>Export</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}