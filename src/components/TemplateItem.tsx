import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    Alert, Switch, StyleSheet
} from 'react-native';
import { useTaskStore } from '../stores/taskStore';
import { Link } from 'expo-router';

interface TemplateNode {
    id: string;
    title: string;
    children?: TemplateNode[];
    created_at?: string;
}

interface TemplateItemProps {
    templateNode: TemplateNode;
    expandedTemplates: Set<string>;
    onToggleExpand: (id: string) => void;
    onUseTemplate: (id: string) => void;
    onDeleteTemplate: (id: string, title: string) => void;
    level: number;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
                                                              templateNode,
                                                              expandedTemplates,
                                                              onToggleExpand,
                                                              onUseTemplate,
                                                              onDeleteTemplate,
                                                              level
                                                          }) => {
    const { addTemplateRelation, createTemplate } = useTaskStore();
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(templateNode.title);
    const [expanded, setExpanded] = useState(false);

    const hasChildren = templateNode.children && templateNode.children.length > 0;

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            // First create the new template
            createTemplate(newSubtaskTitle.trim(), templateNode.id)
                .then(() => {
                    setNewSubtaskTitle('');
                    setIsAddingSubtask(false);
                })
                .catch(error => {
                    Alert.alert('Error', 'Failed to add subtask');
                });
        }
    };

    const handleAddExistingTemplate = (existingTemplateId: string) => {
        addTemplateRelation(templateNode.id, existingTemplateId)
            .catch(error => {
                Alert.alert('Error', 'Failed to add existing template');
            });
    };

    const handleUpdateTitle = () => {
        if (editTitle.trim() && editTitle !== templateNode.title) {
            // This would need to be added to your store
            // updateTemplate(templateNode.id, editTitle, templateNode.children?.map(c => c.id) || []);
        }
        setIsEditing(false);
    };

    const indentWidth = level * 20;

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Pressable onPress={() => setExpanded(!expanded)} style={styles.expand}>
                    <Text>{hasChildren ? (expanded ? '▼' : '▶') : '•'}</Text>
                </Pressable>

                {/*<View className="flex-1">*/}
                {isEditing ? (
                    <TextInput
                        style={styles.input}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        onSubmitEditing={handleUpdateTitle}
                        onBlur={handleUpdateTitle}
                        autoFocus
                    />
                ) : (
                    <Pressable style={styles.text} onLongPress={() => setIsEditing(true)}>
                        <Text className="text-gray-900 text-base font-medium">{templateNode.title}</Text>
                    </Pressable>
                )}
                {/*</View>*/}
                <Pressable onPress={() => setIsAddingSubtask(!isAddingSubtask)} style={styles.iconButton}>
                    <Text style={styles.icon}>+</Text>
                </Pressable>

                <Pressable onPress={() => onDeleteTemplate(templateNode.id, templateNode.title)} style={styles.iconButton}>
                    <Text style={styles.icon}>x</Text>
                </Pressable>
            </View>

            {/* Add Subtask Input */}
            {isAddingSubtask && (
                <View
                    className="px-4 py-2 bg-gray-50 border-t border-gray-200"
                    style={{ paddingLeft: 42 + indentWidth }}
                >
                    <View className="flex-row">
                        <TextInput
                            value={newSubtaskTitle}
                            onChangeText={setNewSubtaskTitle}
                            placeholder="Add subtask template..."
                            placeholderTextColor="#9CA3AF"
                            onSubmitEditing={handleAddSubtask}
                            className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-gray-900 bg-white"
                        />
                        <Pressable
                            onPress={handleAddSubtask}
                            disabled={!newSubtaskTitle.trim()}
                            className={`px-4 py-2 rounded-r-lg justify-center ${
                                newSubtaskTitle.trim() ? 'bg-green-500' : 'bg-green-300'
                            }`}
                        >
                            {/*<Text className="text-white font-semibold text-sm">Add</Text>*/}
                        </Pressable>
                    </View>

                    {/*/!* Quick Add Existing Templates *!/*/}
                    {/*<View className="mt-2">*/}
                    {/*    <Text className="text-gray-600 text-sm mb-1">Or add existing template:</Text>*/}
                    {/*    <Link*/}
                    {/*        href={{*/}
                    {/*            pathname: "/template-selector",*/}
                    {/*            params: { parentTemplateId: templateNode.id }*/}
                    {/*        }}*/}
                    {/*        asChild*/}
                    {/*    >*/}
                    {/*        <Pressable className="bg-purple-500 px-3 py-2 rounded">*/}
                    {/*            <Text className="text-white text-sm font-medium text-center">*/}
                    {/*                Browse Templates*/}
                    {/*            </Text>*/}
                    {/*        </Pressable>*/}
                    {/*    </Link>*/}
                    {/*</View>*/}
                </View>
            )}
            {/* Child Templates */}
            {expanded && hasChildren && (
             <View style={styles.children}>
                 {templateNode.children?.map(child => (
                     <TemplateItem
                         key={child.id}
                         templateNode={child}
                         expandedTemplates={expandedTemplates}
                         onToggleExpand={onToggleExpand}
                         onUseTemplate={onUseTemplate}
                         onDeleteTemplate={onDeleteTemplate}
                         level={level + 1}
                     />
                 ))}
             </View>
            )}
        </View>
    );
    // return (
    //     <View className="border-b border-gray-100 bg-white">
    //         {/* Main Template Row */}
    //         <View
    //             className="flex-row items-center py-3 px-4"
    //             style={{ paddingLeft: 16 + indentWidth }}
    //         >
    //             {/* Expand/Collapse Button */}
    //             <Pressable
    //                 onPress={() => onToggleExpand(templateNode.id)}
    //                 className="w-6 h-6 justify-center items-center mr-2"
    //                 disabled={!hasChildren}
    //             >
    //                 <Text className="text-gray-500 text-sm">
    //                     {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
    //                 </Text>
    //             </Pressable>
    //
    //             {/* Template Title */}
    //             <View className="flex-1">
    //                 {isEditing ? (
    //                     <TextInput
    //                         value={editTitle}
    //                         onChangeText={setEditTitle}
    //                         onSubmitEditing={handleUpdateTitle}
    //                         onBlur={handleUpdateTitle}
    //                         autoFocus
    //                         className="border border-gray-300 rounded px-2 py-1 text-gray-900 bg-white"
    //                     />
    //                 ) : (
    //                     <Pressable onLongPress={() => setIsEditing(true)}>
    //                         <Text className="text-gray-900 text-base font-medium">
    //                             {templateNode.title}
    //                         </Text>
    //                     </Pressable>
    //                 )}
    //             </View>
    //
    //             {/* Action Buttons */}
    //             <View className="flex-row items-center space-x-2">
    //                 {/* Use Template Button */}
    //                 <Pressable
    //                     onPress={() => onUseTemplate(templateNode.id)}
    //                     className="bg-blue-500 px-3 py-1 rounded"
    //                 >
    //                     <Text className="text-white text-sm font-medium">Use</Text>
    //                 </Pressable>
    //
    //                 {/* Add Subtask Button */}
    //                 <Pressable
    //                     onPress={() => setIsAddingSubtask(!isAddingSubtask)}
    //                     className="bg-green-500 px-3 py-1 rounded"
    //                 >
    //                     <Text className="text-white text-sm font-medium">+ Subtask</Text>
    //                 </Pressable>
    //
    //                 {/* Delete Button */}
    //                 <Pressable
    //                     onPress={() => onDeleteTemplate(templateNode.id, templateNode.title)}
    //                     className="bg-red-500 px-3 py-1 rounded"
    //                 >
    //                     <Text className="text-white text-sm font-medium">Delete</Text>
    //                 </Pressable>
    //             </View>
    //         </View>
    //
    //         {/* Add Subtask Input */}
    //         {isAddingSubtask && (
    //             <View
    //                 className="px-4 py-2 bg-gray-50 border-t border-gray-200"
    //                 style={{ paddingLeft: 42 + indentWidth }}
    //             >
    //                 <View className="flex-row">
    //                     <TextInput
    //                         value={newSubtaskTitle}
    //                         onChangeText={setNewSubtaskTitle}
    //                         placeholder="Add subtask template..."
    //                         placeholderTextColor="#9CA3AF"
    //                         onSubmitEditing={handleAddSubtask}
    //                         className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-gray-900 bg-white"
    //                     />
    //                     <Pressable
    //                         onPress={handleAddSubtask}
    //                         disabled={!newSubtaskTitle.trim()}
    //                         className={`px-4 py-2 rounded-r-lg justify-center ${
    //                             newSubtaskTitle.trim() ? 'bg-green-500' : 'bg-green-300'
    //                         }`}
    //                     >
    //                         <Text className="text-white font-semibold text-sm">Add</Text>
    //                     </Pressable>
    //                 </View>
    //
    //                 {/* Quick Add Existing Templates */}
    //                 <View className="mt-2">
    //                     <Text className="text-gray-600 text-sm mb-1">Or add existing template:</Text>
    //                     <Link
    //                         href={{
    //                             pathname: "/template-selector",
    //                             params: { parentTemplateId: templateNode.id }
    //                         }}
    //                         asChild
    //                     >
    //                         <Pressable className="bg-purple-500 px-3 py-2 rounded">
    //                             <Text className="text-white text-sm font-medium text-center">
    //                                 Browse Templates
    //                             </Text>
    //                         </Pressable>
    //                     </Link>
    //                 </View>
    //             </View>
    //         )}
    //
    //         {/* Child Templates */}
    //         {isExpanded && hasChildren && (
    //             <View>
    //                 {templateNode.children?.map(child => (
    //                     <TemplateItem
    //                         key={child.id}
    //                         templateNode={child}
    //                         expandedTemplates={expandedTemplates}
    //                         onToggleExpand={onToggleExpand}
    //                         onUseTemplate={onUseTemplate}
    //                         onDeleteTemplate={onDeleteTemplate}
    //                         level={level + 1}
    //                     />
    //                 ))}
    //             </View>
    //         )}
    //     </View>
    // );
};


const styles = StyleSheet.create({
    container: { marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center" },
    expand: { width: 24, alignItems: "center" },
    input: { flex: 1, padding: 8, borderWidth: 1, borderColor: "#ddd", borderRadius: 6, marginHorizontal: 8 },
    text: { flex: 1, padding: 8, marginHorizontal: 8 },
    iconButton: { padding: 6, marginLeft: 6, backgroundColor: "#eee", borderRadius: 6 },
    icon: { fontSize: 18, fontWeight: "600" },
    children: { paddingLeft: 20, marginTop: 6 },
});