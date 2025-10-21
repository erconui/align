import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, Pressable, Switch, StyleSheet} from "react-native";
import { TaskNode } from '../stores/taskStore';

interface TaskItemProps {
    taskNode: TaskNode;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    addTask: (id: string, parentId: string | null) => void;
    updateTaskTitle: (id: string, title: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
                                                      taskNode,
                                                      toggleTask,
                                                      deleteTask,
                                                      addTask,
                                                      updateTaskTitle
                                                  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [editTitle, setEditTitle] = useState(taskNode.title);

    useEffect(() => {
        setEditTitle(taskNode.title);
    }, [taskNode.title]);

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Pressable onPress={() => setExpanded(!expanded)} style={styles.expand}>
                    <Text>{(taskNode.children && taskNode.children.length > 0) ? (expanded ? "▼" : "▶") : " "}</Text>
                </Pressable>

                <Switch
                    value={!!taskNode.completed}
                    onValueChange={ () => toggleTask(taskNode.id)}
                />
                <TextInput
                    style={styles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    onSubmitEditing={() => updateTaskTitle(taskNode.id, editTitle)}
                    onBlur={() => updateTaskTitle(taskNode.id, editTitle)}
                    returnKeyType="done"
                />
                <Pressable onPress={ () => addTask("", taskNode.id)} style={styles.iconButton}>
                    <Text style={styles.icon}>+</Text>
                </Pressable>

                <Pressable onPress={() => deleteTask(taskNode.id)} style={styles.iconButton}>
                    <Text style={styles.icon}>x</Text>
                </Pressable>
            </View>

            {expanded && taskNode.children && taskNode.children.length > 0 && (
            <View style={styles.children}>
                {taskNode.children?.map(child => (
                    <TaskItem
                        key={child.id}
                        taskNode={child}
                        toggleTask={toggleTask}
                        deleteTask={deleteTask}
                        addTask={addTask}
                        updateTaskTitle={updateTaskTitle}
                    />
                ))}
            </View>)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 6 },
    row: { flexDirection: "row", alignItems: "center" },
    expand: { width: 24, alignItems: "center" },
    input: { flex: 1, padding: 8, borderWidth: 1, borderColor: "#ddd", borderRadius: 6, marginHorizontal: 8 },
    iconButton: { padding: 6, marginLeft: 6, backgroundColor: "#eee", borderRadius: 6 },
    icon: { fontSize: 18, fontWeight: "600" },
    children: { paddingLeft: 20, marginTop: 6 },
});