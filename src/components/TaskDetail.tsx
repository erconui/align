import { format, parseISO } from 'date-fns';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { TaskNode } from '../stores/taskStore';
// interface TaskNode {
//   id: string;
//   template_id: string | null;
//   parent_id: string | null;
//   title: string;
//   completed: boolean;
//   completed_at: string | null;
//   due_date: string | null;
//   created_at: string | null;
//   updated_at: string | null;
//   recurrence_rule: string | null;
//   position: number;
//   expanded: boolean;
//   private: boolean;
// }

interface TaskDetailViewProps {
  task: TaskNode;
  onUpdate: (updates: Partial<TaskNode>) => void;
  onDelete: () => void;
  onClose: () => void;
  visible: boolean;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  onUpdate,
  onDelete,
  onClose,
  visible
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [newSubtask, setNewSubtask] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    dueDate: true,
    recurrence: true,
    subtasks: true,
    notes: false
  });

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdate({ title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDueDateChange = (date: string | null) => {
    onUpdate({ due_date: date });
  };

  const handleRecurrenceChange = (rule: string | null) => {
    onUpdate({ recurrence_rule: rule });
  };

  const handleCompletionToggle = () => {
    onUpdate({ 
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete }
      ]
    );
  };

  const formatRecurrenceRule = (rule: string | null): string => {
    if (!rule) return 'No repetition';
    if (rule.includes('FREQ=DAILY')) return 'Daily';
    if (rule.includes('FREQ=WEEKLY')) return 'Weekly';
    if (rule.includes('FREQ=MONTHLY')) return 'Monthly';
    return 'Custom repetition';
  };

  const QuickDateButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.quickDateButton} onPress={onPress}>
      <Text style={styles.quickDateText}>{label}</Text>
    </TouchableOpacity>
  );

  const SectionHeader = ({ 
    icon, 
    title, 
    value, 
    expanded, 
    onToggle 
  }: { 
    icon: string; 
    title: string; 
    value: string; 
    expanded: boolean; 
    onToggle: () => void; 
  }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
      <Text style={styles.expandIcon}>{expanded ? '−' : '+'}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Switch
              value={task.completed}
              onValueChange={handleCompletionToggle}
              style={styles.completionSwitch}
            />
            <View style={styles.titleContainer}>
              {isEditingTitle ? (
                <TextInput
                  style={styles.titleInput}
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  onBlur={handleTitleSave}
                  onSubmitEditing={handleTitleSave}
                  autoFocus
                  multiline
                />
              ) : (
                <TouchableOpacity 
                  style={styles.titleDisplay}
                  onPress={() => setIsEditingTitle(true)}
                >
                  <Text style={[
                    styles.taskTitle,
                    task.completed && styles.completedTitle
                  ]}>
                    {task.title}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Due Date Section */}
          <View style={styles.section}>
            <SectionHeader
              icon="📅"
              title="Due Date"
              value={task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : 'No due date'}
              expanded={expandedSections.dueDate}
              onToggle={() => toggleSection('dueDate')}
            />
            
            {expandedSections.dueDate && (
              <View style={styles.sectionContent}>
                <View style={styles.quickDates}>
                  <QuickDateButton
                    label="Today"
                    onPress={() => {
                      const today = new Date().toISOString().split('T')[0];
                      handleDueDateChange(today);
                    }}
                  />
                  <QuickDateButton
                    label="Tomorrow"
                    onPress={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      handleDueDateChange(tomorrow.toISOString().split('T')[0]);
                    }}
                  />
                  <QuickDateButton
                    label="Next Week"
                    onPress={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      handleDueDateChange(nextWeek.toISOString().split('T')[0]);
                    }}
                  />
                </View>
                <TextInput
                  style={styles.dateInput}
                  value={task.due_date || ''}
                  onChangeText={(text) => handleDueDateChange(text || null)}
                  placeholder="YYYY-MM-DD"
                />
                {task.due_date && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => handleDueDateChange(null)}
                  >
                    <Text style={styles.clearButtonText}>Clear Due Date</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Recurrence Section */}
          <View style={styles.section}>
            <SectionHeader
              icon="🔄"
              title="Repeat"
              value={formatRecurrenceRule(task.recurrence_rule)}
              expanded={expandedSections.recurrence}
              onToggle={() => toggleSection('recurrence')}
            />
            
            {expandedSections.recurrence && (
              <View style={styles.sectionContent}>
                <View style={styles.recurrenceOptions}>
                  {[
                    { label: 'Does not repeat', value: null },
                    { label: 'Daily', value: 'FREQ=DAILY' },
                    { label: 'Weekly', value: 'FREQ=WEEKLY' },
                    { label: 'Monthly', value: 'FREQ=MONTHLY' },
                    { label: 'Yearly', value: 'FREQ=YEARLY' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      style={[
                        styles.recurrenceOption,
                        task.recurrence_rule === option.value && styles.recurrenceOptionSelected
                      ]}
                      onPress={() => handleRecurrenceChange(option.value)}
                    >
                      <Text style={[
                        styles.recurrenceOptionText,
                        task.recurrence_rule === option.value && styles.recurrenceOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Subtasks Section */}
          <View style={styles.section}>
            <SectionHeader
              icon="⭘"
              title="Subtasks"
              value="0" // You would dynamically calculate this
              expanded={expandedSections.subtasks}
              onToggle={() => toggleSection('subtasks')}
            />
            
            {expandedSections.subtasks && (
              <View style={styles.sectionContent}>
                <View style={styles.addSubtask}>
                  <TextInput
                    style={styles.subtaskInput}
                    placeholder="Add a subtask..."
                    value={newSubtask}
                    onChangeText={setNewSubtask}
                    onSubmitEditing={() => {
                      if (newSubtask.trim()) {
                        // Handle subtask creation
                        setNewSubtask('');
                      }
                    }}
                  />
                </View>
                {/* Subtasks list would be mapped here */}
                <View style={styles.subtasksList}>
                  {/* {subtasks.map(subtask => (...))} */}
                </View>
              </View>
            )}
          </View>

          {/* Add Section Button */}
          <TouchableOpacity style={styles.addSection}>
            <Text style={styles.addSectionText}>+ Add Section</Text>
          </TouchableOpacity>

          {/* Metadata */}
          <View style={styles.metadata}>
            {task.created_at && (
              <Text style={styles.metaText}>
                Created: {format(parseISO(task.created_at), 'MMM d, yyyy')}
              </Text>
            )}
            {task.completed_at && (
              <Text style={styles.metaText}>
                Completed: {format(parseISO(task.completed_at), 'MMM d, yyyy')}
              </Text>
            )}
            <Text style={styles.metaText}>
              Position: {task.position}
            </Text>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={confirmDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 20,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  completionSwitch: {
    marginRight: 12,
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  titleContainer: {
    flex: 1,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  titleDisplay: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  section: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  sectionValue: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 18,
    color: '#999',
    fontWeight: '300',
  },
  sectionContent: {
    paddingLeft: 30,
    paddingBottom: 16,
  },
  quickDates: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  quickDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickDateText: {
    fontSize: 14,
    color: '#495057',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  clearButton: {
    padding: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  recurrenceOptions: {
    gap: 8,
  },
  recurrenceOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  recurrenceOptionSelected: {
    backgroundColor: '#007AFF',
  },
  recurrenceOptionText: {
    fontSize: 16,
    color: '#000',
  },
  recurrenceOptionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  addSubtask: {
    marginBottom: 12,
  },
  subtaskInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  subtasksList: {
    // Styles for subtasks list
  },
  addSection: {
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e0e0e0',
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 16,
  },
  addSectionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  metadata: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  deleteButton: {
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});