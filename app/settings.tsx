import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

export default function SettingScreen() {
  const {
    initDB,
    flatTasks,
    templateHierarchy,
    isLoading,
    saveTasks,
    saveTemplates,
    saveRelations
  } = useTaskStore();
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { colors, styles, toggleTheme, theme } = useTheme();

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });

      if (result.canceled || !result.assets?.length) {
        console.log("Import canceled or no file selected");
        return;
      }

      let jsonString: string;

      if (Platform.OS === "web") {
        // Web: DocumentPicker returns a File object
        const file = result.assets[0].file;
        if (!file) throw new Error("File object not available on web");
        jsonString = await file.text();
      } else {
        // Native: read from file URI
        const fileUri = result.assets[0].uri;
        jsonString = await FileSystem.readAsStringAsync(fileUri);
      }

      const parsed = JSON.parse(jsonString);
      console.log(parsed);

      // Handle new structured export format
      if (parsed.tasks && parsed.lists && parsed.listRelations) {
        const { tasks, lists, listRelations } = parsed;
        const templates = lists;
        const relations = listRelations;

        console.log("✅ Imported structured data:", {
          taskCount: tasks.length,
          templateCount: templates.length,
          relationCount: relations.length,
        });

        await saveTasks(tasks);
        await saveTemplates(templates);
        await saveRelations(relations);
      }
      // Handle legacy export (flatTasks only)
      else if (Array.isArray(parsed)) {
        console.log("⚠️ Imported legacy data:", parsed.length, "tasks");
        await saveTasks(parsed);
      } else {
        throw new Error("Invalid JSON format — expected structured export.");
      }

      console.log("✅ Import successful!");
    } catch (error) {
      console.error("Import failed:", error);
      Alert.alert("Import failed", String(error));
    }
  };
  // ---- EXPORT HANDLER ----
  const handleExport = async () => {
    try {
      const exportData = {
        tasks: flatTasks ?? [],
        lists: templateHierarchy.templates ?? [],
        listRelations: templateHierarchy.relations ?? []
      };
      const jsonData = JSON.stringify(exportData, null, 2);
      const fileName = `tasks_export_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      if (Platform.OS === "web") {
        // ✅ Web-friendly download
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a); // Needed in some browsers
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("✅ Web export complete");
        return;
      }
      // Write the file
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      console.log("File exported to:", fileUri);

      // Share the file (if supported)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Export complete", `File saved to:\n${fileUri}`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      Alert.alert("Export failed", String(err));
    }
  };

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
        {!isLoading ? (
          <View>
            <View style={styles.settingsRow}>
              <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>Import Database</Text>
              <Pressable onPress={handleImport} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
                <Text style={{ color: colors.text, fontWeight: '500' }}>Import</Text>
              </Pressable>
            </View>

            <View style={styles.settingsRow}>
              <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>Export Database</Text>
              <Pressable onPress={() => {handleExport();}} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
                <Text style={{ color: colors.text, fontWeight: '500' }}>JSON</Text>
              </Pressable>
              <Pressable onPress={() => {handleExport();}} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
                <Text style={{ color: colors.text, fontWeight: '500' }}>CSV</Text>
              </Pressable>
            </View>

            <View style={styles.settingsRow}>
              <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>Example Database</Text>
              <Pressable onPress={initDB} style={({ pressed }) => pressed ? styles.pressableButtonPressed : styles.settingButton}>
                <Text style={{ color: colors.text, fontWeight: '500' }}>Initialize</Text>
              </Pressable>
            </View>
          </View>):
          <View style={styles.settingsRow}>
            <Text style={{ color: colors.text, fontWeight: '800', flex: 1 }}>Database is loading...</Text>
          </View>
        }

      </View>
      
      {/* <ImportExportComponent/> */}
    </View>
  );
}