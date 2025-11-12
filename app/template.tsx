import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { GlobalSuggestions } from '../src/components/GlobalSuggestions';
import { TemplateItem } from '../src/components/TemplateItem';
import { useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

const ITEM_HEIGHT = 37.33;
const INDENTATION_WIDTH = 20;

export default function TemplateScreen() {
  const {
    focusedId,
    tree,
    templateHierarchy,
    isLoading,
    error,
    createTemplate,
    addTemplateAfter,
    updateTemplate,
    deleteTemplate,
    loadTemplates,
    createTaskFromTemplate,
    replaceTemplate,
    removeTemplate,
    toggleTemplateExpand,
    moveTemplate
  } = useTaskStore();
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  const [suggestionsPosition, setSuggestionsPosition] = useState<{ x: number; y: number; width: number } | null>(null);
  const [suggestionsItemId, setSuggestionsItemId] = useState<string | null>(null);
  const [suggestionsParentId, setSuggestionsParentId] = useState<string | null>(null);
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [containerLayout, setContainerLayout] = useState<{y: number}>({y: 0});

  useEffect(() => {
    loadTemplates();
  }, []);
  useEffect(() => {
    setSuggestionsVisible(false);
  }, [focusedId]);
  useEffect(() => {
    remeasureAllItems();
    // console.log('Loaded tasks:', flatTasks);
  }, [tree]);

  const handleAddTemplate = () => {
    if (newTemplateTitle.trim()) {
      createTemplate(newTemplateTitle.trim(), null, true);
      setNewTemplateTitle('');
    }
  };

  const handleInputMeasure = (position: { x: number; y: number; width: number }, itemId: string, parentId: string | null) => {
    setSuggestionsPosition(position);
    setSuggestionsItemId(itemId);
    setSuggestionsParentId(parentId || null);
    setSuggestionsVisible(true);
  };

  const handleTextChange = (text: string) => {
    setCurrentSearchText(text);
    setSuggestionsVisible(text.length > 0);
  };

  const handleSuggestionSelect = async (suggestion: { id: string; title: string }, itemId: string, parentId: string | null) => {
    await replaceTemplate(parentId, itemId, suggestion.id);
    setSuggestionsVisible(false);
    setCurrentSearchText('');
    setSuggestionsItemId(null);
    setSuggestionsParentId(null);
  };

  const closeSuggestions = () => {
    setTimeout(() => {
      setSuggestionsVisible(false);
    }, 200);
  };

  const suggestions = useMemo(() => {
    return tree.map(node => ({
      id: node.id,
      title: node.title,
    }));
  }, [tree]);
  const { colors, styles } = useTheme();
  const itemRefs = useRef<Record<string, View | null>>({});

  const handleUseTemplate = (templateId: string) => {
    Alert.alert(
      'Use Template',
      'Add this template to your task list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Tasks',
          onPress: () => createTaskFromTemplate(templateId)
        }
      ]
    );
  };

  const toggleExpand = (templateId: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  const remeasureAllItems = () => {
    itemLayouts.current = {};
    Object.entries(itemRefs.current).forEach(([id, ref]) => {
      if (ref) {
        ref.measureInWindow((x, y, width, height) => {
          // const indent = 20 + (itemLevels.current[id] || 0) * 20; // include padding
          registerItemLayout(id, { x: x, y, width, height });
        });
      }
    });
  };
  //template itemLayout id is the tasktemplaterelation not the template id
  const itemLayouts = useRef<Record<string, {x:number; y:number; width:number; height:number}>>({});
  const registerItemLayout = (itemId: string, layout: {x:number; y:number; width:number; height:number}) => {
    itemLayouts.current[itemId] = layout;
  };
  const registerRefs = (itemId: string, ref: View | null) => {
    // itemLayouts.current[itemId] = layout;
    itemRefs.current[itemId] = ref;
  }
  // Measure only the list container once
  const handleContainerLayout = (event: any) => {
    const layout = event.nativeEvent.layout;
    console.log("tasks layout", layout);
    setContainerLayout(layout);
  };
  // Core function: Calculate all positions from tree data
  const calculateTreePositions = () => {
    const positions: Record<string, { x: number; y: number; width: number; height: number }> = {};
    let currentY = containerLayout.y;// + HEADER_HEIGHT;
    console.log('tree');
    console.log(tree);

    const traverse = (nodes: any[], depth: number = 0) => {
      nodes.forEach(node => {
        // Calculate position for this node
        positions[node.relId] = {
          x: depth * INDENTATION_WIDTH,
          y: currentY,
          width: 400 - (depth * INDENTATION_WIDTH), // Adjust based on your screen
          height: ITEM_HEIGHT
        };
        
        currentY += ITEM_HEIGHT;
        
        // Recursively traverse children if expanded
        if (node.expanded && node.children && node.children.length > 0) {
          traverse(node.children, depth + 1);
        }
      });
    };

    // Start with root nodes (no parentId)
    traverse(tree);
    
    return positions;
  };
  const handleDrop = (itemId: string, finalPosition: { x: number; y: number }) => {
    requestAnimationFrame(() => {
      const layouts = calculateTreePositions();
      console.log('layout',layouts);
      const dragged = layouts[itemId];
      if (!dragged) return;

      // Compute final drop position
      const dropY = dragged.y + finalPosition.y;
      const dropCenterY = dropY + dragged.height / 2;
      const dropX = dragged.x + finalPosition.x;

      // Find potential drop target
      const entries = Object.entries(layouts)//.filter(([id]) => id !== itemId);
      entries.find(([_WORKLET_RUNTIME, {x}]) => dropX )
      const targetEntry = entries.find(([_, { y, height }]) => dropCenterY > y && dropCenterY < y + height);
      const lowestY = Object.values(layouts).length > 0 
        ? Math.min(...Object.values(layouts).map(layout => layout.y))
        : 0;
      if (!targetEntry) {
        if (dropY < lowestY + 2*dragged.height/3) {
          moveTemplate(itemId, null, 0); // move it to the top of the list
        } else {
        console.log('No valid drop target found.', dropY, lowestY, lowestY + dragged.height/2);
        }
        return;
      };
      const [targetId, targetLayout] = targetEntry;
      const xshift = dropX - targetLayout.x;
      if (xshift >= INDENTATION_WIDTH) {
        moveTemplate(itemId, targetId, 1);
      } else {
        moveTemplate(itemId, targetId, Math.round(xshift/INDENTATION_WIDTH));
      }

    });
  };
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ fontSize: 18, color: '#6B7280', marginTop: 16 }}>Loading lists...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text }}>Lists</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {tree.length} {tree.length === 1 ? 'list' : 'lists'}
        </Text>
      </View>

      {/* Add Template Form */}
      <View style={{ padding: 16, backgroundColor: colors.background, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            value={newTemplateTitle}
            onChangeText={setNewTemplateTitle}
            placeholder="Add a new list..."
            placeholderTextColor={colors.muted}
            onSubmitEditing={handleAddTemplate}
            style={{ ...styles.input, flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: 16, marginHorizontal: 0 }}
          />
          <TouchableOpacity
            onPress={handleAddTemplate}
            disabled={!newTemplateTitle.trim()}
            style={{ borderTopRightRadius: 8, borderBottomRightRadius: 8, ...styles.pressableButton }}
          >
            <Ionicons name="add" size={20} color={colors.tint} paddingVertical={styles.pressableButton.paddingVertical} />
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={{ color: '#ef4444', marginTop: 8, fontSize: 12 }}>{error}</Text>
        )}
      </View>

      {/* Global Suggestions */}
      <GlobalSuggestions
        suggestions={suggestions}
        position={suggestionsPosition}
        visible={suggestionsVisible}
        searchText={currentSearchText}
        onSuggestionSelect={(suggestion) => {
          if (suggestionsItemId) {
            handleSuggestionSelect(suggestion, suggestionsItemId, suggestionsParentId);
          }
        }}
      />

      {/* Templates List */}
      <View className="flex-1" onLayout={handleContainerLayout}>
        {tree.length === 0 ? (
          <View style={styles.settingsRow}>
            <Text style={styles.headerText}>
              No templates yet. Create your first template to get started!
            </Text>
          </View>
        ) : (
          <FlatList
            data={tree}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TemplateItem
                templateNode={item}
                expandedTemplates={expandedTemplates}
                onToggleExpand={toggleExpand}
                onUseTemplate={handleUseTemplate}
                deleteTemplate={deleteTemplate}
                updateTemplate={updateTemplate}
                addTemplateAfter={addTemplateAfter}
                focusedId={focusedId}
                parentId={null}
                removeTemplate={removeTemplate}
                onInputMeasure={handleInputMeasure}
                onTextChange={handleTextChange}
                generateList={createTaskFromTemplate}
                toggleExpand={async (parentId, id) => { toggleTemplateExpand(parentId, id); }}
                closeSuggestions={closeSuggestions}
                registerRefs={registerRefs}
                handleDrop={handleDrop}
              />
            )}
          />
        )}
      </View>
    </View>
  );
}