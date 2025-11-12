import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export interface FileImportResult {
  success: boolean;
  data?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
  uri?: string;
}

export interface FileExportResult {
  success: boolean;
  error?: string;
  filePath?: string;
}

export const importFile = async (): Promise<FileImportResult> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, error: 'User canceled file selection' };
    }

    const asset = result.assets[0];
    
    if (!asset) {
      return { success: false, error: 'No file selected' };
    }

    return {
      success: true,
      fileName: asset.name,
      fileSize: asset.size,
      uri: asset.uri,
    };
  } catch (error) {
    console.error('File import error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Function to read file content
export const readFileContent = async (uri: string): Promise<string> => {
  try {
    const content = await FileSystem.readAsStringAsync(uri);
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }
};

// Main export function
export const exportToFile = async (
  data: string,
  fileName: string,
  mimeType: string = 'application/json'
): Promise<FileExportResult> => {
  try {
    const fileExtension = getFileExtension(mimeType);
    const finalFileName = `${fileName}_${new Date().toISOString().replace(/[:.]/g, '-')}.${fileExtension}`;

    if (Platform.OS === 'web') {
      // Web: use download method
      downloadFileWeb(data, finalFileName, mimeType);
      return { success: true };
    } else {
      // Mobile: create temporary file and share
      const fileUri = `${FileSystem.cacheDirectory}${finalFileName}`;
      
      // Write file - this should work in v19
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Export ${fileName}`,
        });
        return { success: true, filePath: fileUri };
      } else {
        return { success: false, error: 'Sharing not available' };
      }
    }
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Alternative approach using DocumentPicker for mobile save
export const saveToFile = async (
  data: string,
  fileName: string,
  mimeType: string = 'application/json'
): Promise<FileExportResult> => {
  try {
    if (Platform.OS === 'web') {
      downloadFileWeb(data, fileName, mimeType);
      return { success: true };
    } else {
      // On mobile, we'll create a temporary file and let the user save it
      const fileExtension = getFileExtension(mimeType);
      const finalFileName = `${fileName}.${fileExtension}`;
      const fileUri = `${FileSystem.cacheDirectory}${finalFileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, data);
      
      // Use Sharing to let user save the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: `Save ${fileName}`,
          UTI: mimeType, // iOS uniform type identifier
        });
        return { success: true, filePath: fileUri };
      } else {
        return { success: false, error: 'File sharing not available' };
      }
    }
  } catch (error) {
    console.error('Save to file error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Helper function to get file extension from MIME type
const getFileExtension = (mimeType: string): string => {
  const extensions: { [key: string]: string } = {
    'application/json': 'json',
    'text/plain': 'txt',
    'application/csv': 'csv',
    'text/csv': 'csv',
    'application/pdf': 'pdf',
  };
  
  return extensions[mimeType] || 'txt';
};

// Web-specific file download
const downloadFileWeb = (data: string, fileName: string, mimeType: string) => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Function to export as JSON
export const exportAsJson = async (data: any, fileName: string = 'data'): Promise<FileExportResult> => {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return await exportToFile(jsonString, fileName, 'application/json');
};

// Function to export as CSV
export const exportAsCsv = async (data: any[], fileName: string = 'data'): Promise<FileExportResult> => {
  if (!data || data.length === 0) {
    return await exportToFile('', fileName, 'text/csv');
  }

  const headers = Object.keys(data[0] || {}).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      `"${String(value).replace(/"/g, '""')}"`
    ).join(',')
  );
  const csvString = [headers, ...rows].join('\n');
  
  return await exportToFile(csvString, fileName, 'text/csv');
};

// Check available FileSystem methods (for debugging)
export const checkFileSystemAPI = () => {
  console.log('Available FileSystem methods:', Object.keys(FileSystem));
  console.log('Cache directory:', FileSystem.cacheDirectory);
  console.log('Document directory:', FileSystem.documentDirectory);
};