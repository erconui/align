import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
// import { Directory, File, documentDirectory } from "expo-file-system";
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

  // const handleImport = async (): Promise<void> => {
  //   setIsImporting(true);
    
  //   try {
  //     const result = await importFile();
      
  //     if (result.success) {
  //       // File was selected successfully
  //       Alert.alert(
  //         'File Selected', 
  //         `File: ${result.fileName}\nSize: ${result.fileSize} bytes\n\nYou can now process this file.`
  //       );
        
  //       // Here you can add your file processing logic
  //       console.log('File selected:', result);
        
  //     } else {
  //       Alert.alert('Import Cancelled', result.error || 'No file was selected');
  //     }
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to import file');
  //     console.error('Import error:', error);
  //   } finally {
  //     setIsImporting(false);
  //   }
  // };

  // const handleJSONExport = async (): Promise<void> => {
  //   setIsExporting(true);
    
  //   try {
  //     const result = await exportAsJson(flatTasks, 'tasks');
      
  //     if (result.success) {
  //       Alert.alert('Success', 'Tasks exported successfully!');
  //     } else {
  //       Alert.alert('Export Failed', result.error || 'Unknown error occurred');
  //     }
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to export tasks');
  //     console.error('Export error:', error);
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  // const handleCSVExport = async (): Promise<void> => {
  //   setIsExporting(true);
    
  //   try {
  //     const result = await exportAsCsv(flatTasks, 'tasks');
      
  //     if (result.success) {
  //       Alert.alert('Success', 'Tasks exported successfully!');
  //     } else {
  //       Alert.alert('Export Failed', result.error || 'Unknown error occurred');
  //     }
  //   } catch (error) {
  //     Alert.alert('Error', 'Failed to export tasks');
  //     console.error('Export error:', error);
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  // const handleImport = async () => {
  //   try {
  //     if (Platform.OS === "web") {
  //       // Web file picker
  //       const input = document.createElement("input");
  //       input.type = "file";
  //       input.accept = ".json,.csv";
  //       input.onchange = (event: any) => {
  //         const file = event.target.files[0];
  //         if (file) {
  //           Alert.alert("File selected", file.name);
  //           // Later: read file.text() here
  //         }
  //       };
  //       input.click();
  //     } else {
  //       // Native file picker
  //       const result = await DocumentPicker.getDocumentAsync({
  //         type: ["application/json", "text/csv"],
  //       });
  //       if (result.assets && result.assets.length > 0) {
  //         const file = result.assets[0];
  //         Alert.alert("File selected", file.name);
  //         // Later: read file.uri with FileSystem.readAsStringAsync()
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Import failed:", err);
  //     Alert.alert("Import failed", String(err));
  //   }
  // };
  // const handleImport = async () => {
  //   try {
  //     const result = await DocumentPicker.getDocumentAsync({
  //       type: "application/json",
  //     });

  //     if (result.canceled || !result.assets?.length) {
  //       console.log("Import canceled or no file selected");
  //       return;
  //     }

  //     const fileUri = result.assets[0].uri;
  //     const jsonString = await FileSystem.readAsStringAsync(fileUri);
  //     const parsed = JSON.parse(jsonString);

  //     // Handle new structured export format
  //     if (parsed.tasks && parsed.templates && parsed.relations) {
  //       const { tasks, lists, listRelations } = parsed;
  //       const templates = lists;
  //       const relations = listRelations;

  //       console.log("✅ Imported structured data:", {
  //         taskCount: tasks.length,
  //         templateCount: templates.length,
  //         relationCount: relations.length,
  //       });

  //       // Example: update your stores or database here
  //       await saveTasks(tasks);
  //       await saveTemplates(templates);
  //       await saveRelations(relations);
  //     }
  //     // Handle legacy export (flatTasks only)
  //     else if (Array.isArray(parsed)) {
  //       console.log("⚠️ Imported legacy data:", parsed.length, "tasks");
  //       await saveTasks(parsed);
  //     } else {
  //       throw new Error("Invalid JSON format — expected structured export.");
  //     }

  //     console.log("✅ Import successful!");
  //   } catch (error) {
  //     console.error("Import failed:", error);
  //     Alert.alert("Import failed", String(error));
  //   }
  // };
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