import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  items: string[];
  initialOrder?: string[];
  onAnswer: (order: string[]) => void;
}

function SortableItem({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-white border rounded-lg cursor-move select-none touch-none"
    >
      {id}
    </div>
  );
}

export default function OrderingQuestion({ items, initialOrder, onAnswer }: Props) {
  const [order, setOrder] = useState<string[]>(initialOrder || items);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    setOrder(initialOrder || items);
  }, [items, initialOrder]);

  useEffect(() => {
    if (!initialOrder && items.length > 0) {
      onAnswer(items);
    }
  }, []);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const activeId = String(active.id);
      const overId = String(over.id);
      const oldIndex = order.indexOf(activeId);
      const newIndex = order.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const next = arrayMove(order, oldIndex, newIndex);
        setOrder(next);
        onAnswer(next);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {order.map((item) => (
            <SortableItem key={item} id={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
