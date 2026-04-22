// components/ThreePanelLayout.tsx
'use client';

import React from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MapIcon,
  MusicalNoteIcon,
  ChatBubbleBottomCenterIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Panel {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
}

const defaultPanels: Panel[] = [
  {
    id: 'map',
    title: '地图',
    icon: <MapIcon className="w-5 h-5" />,
    isOpen: true,
  },
  {
    id: 'music',
    title: '音乐',
    icon: <MusicalNoteIcon className="w-5 h-5" />,
    isOpen: true,
  },
  {
    id: 'chat',
    title: '聊天',
    icon: <ChatBubbleBottomCenterIcon className="w-5 h-5" />,
    isOpen: true,
  },
];

const SortablePanelItem = ({
  panel,
  onClose,
}: {
  panel: Panel;
  onClose: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: panel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex-1 flex-shrink-0 w-72 h-full border-l border-gray-200 bg-white shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 font-medium">
          {panel.icon}
          <span>{panel.title}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose(panel.id);
          }}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="p-4 h-[calc(100%-48px)] overflow-auto text-gray-600">
        {panel.title} 面板内容区域
      </div>
    </div>
  );
};

const NavItem = ({ panel, onClick }: { panel: Panel; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
        panel.isOpen
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-500 bg-transparent hover:bg-gray-100'
      }`}
    >
      {panel.icon}
    </button>
  );
};

export default function ThreePanelLayout() {
  const [isMounted, setIsMounted] = useState(false);
  const [panels, setPanels] = useState<Panel[]>(defaultPanels);
  const [activeIds, setActiveIds] = useState<string[]>(
    defaultPanels.filter((p) => p.isOpen).map((p) => p.id)
  );

  // 解决水合警告
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleClose = useCallback((id: string) => {
    setPanels((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isOpen: false } : item))
    );
    setActiveIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const handleOpen = useCallback((id: string) => {
    setPanels((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isOpen: true } : item))
    );
    setActiveIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  // ✅ 修复：拖拽结束逻辑（彻底修复TS报错 + 排序错乱）
  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;

      const oldIndex = activeIds.indexOf(active.id as string);
      const newIndex = activeIds.indexOf(over.id as string);

      // 计算新顺序
      const newOrder = arrayMove(activeIds, oldIndex, newIndex);
      setActiveIds(newOrder);

      // 同步更新 panels 顺序（核心修复）
      setPanels((prevPanels) =>
        [...prevPanels].sort((a, b) => {
          return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
        })
      );
    },
    [activeIds]
  );

  // 用 activeIds 保证渲染顺序 = 拖拽顺序
  const openPanels = useMemo(() => {
    return activeIds
      .map((id) => panels.find((p) => p.id === id))
      .filter((p): p is Panel => !!p && p.isOpen);
  }, [panels, activeIds]);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <div className="w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-3">
        {panels.map((panel) => (
          <NavItem
            key={panel.id}
            panel={panel}
            onClick={() => handleOpen(panel.id)}
          />
        ))}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeIds}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex h-full">
              {openPanels.map((panel) => (
                <SortablePanelItem
                  key={panel.id}
                  panel={panel}
                  onClose={handleClose}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay />
        </DndContext>
      </div>
    </div>
  );
}
