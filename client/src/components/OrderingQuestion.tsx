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

function SortableItem({ id, index }: { id: string; index: number }) {
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
      className="flex cursor-move touch-none select-none items-center gap-3 border-3 border-ink bg-cloud p-3 shadow-pop transition-shadow"
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center border-3 border-ink bg-sun font-display text-sm tabular-nums"
      >
        {index + 1}
      </span>
      <span className="font-medium">{id}</span>
      <span
        aria-hidden
        className="ml-auto font-display text-lg leading-none text-ash"
        title="Geser untuk mengurutkan"
      >
        ≡
      </span>
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
    <div>
      <p className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ash">
        <span aria-hidden className="font-display text-base text-ink">
          ⇅
        </span>
        Geser kartu untuk mengurutkan
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {order.map((item, i) => (
              <SortableItem key={item} id={item} index={i} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
