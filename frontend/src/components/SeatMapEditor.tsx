import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripHorizontal } from 'lucide-react';
import type { Seat } from '../types';
import { api } from '../api';

const GRID = 20;
const SEAT_W = 120;
const SEAT_H = 56;
const CANVAS_W = 700;
const CANVAS_H = 400;

interface Props {
  seats: Seat[];
  functionId: number;
  onUpdate: () => void;
}

export function SeatMapEditor({ seats, functionId, onUpdate }: Props) {
  const { t } = useTranslation();
  const [localSeats, setLocalSeats] = useState<Seat[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const livePosRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  useEffect(() => {
    setLocalSeats(seats.map(s => ({
      ...s,
      positionX: s.positionX ?? undefined,
      positionY: s.positionY ?? undefined,
    })));
  }, [seats]);

  const snap = (v: number) => Math.round(v / GRID) * GRID;

  const handleDragStart = (e: React.MouseEvent, seatId: number) => {
    e.preventDefault();
    const seat = localSeats.find(s => s.id === seatId);
    if (!seat) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const onMove = (ev: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      let x = snap(ev.clientX - canvasRect.left - offsetX);
      let y = snap(ev.clientY - canvasRect.top - offsetY);
      x = Math.max(0, Math.min(x, CANVAS_W - SEAT_W));
      y = Math.max(0, Math.min(y, CANVAS_H - SEAT_H));
      livePosRef.current.set(seatId, { x, y });
      setLocalSeats(prev => prev.map(s => s.id === seatId ? { ...s, positionX: x, positionY: y } : s));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const pos = livePosRef.current.get(seatId);
      if (pos) {
        api.seats.updatePosition(seatId, pos.x, pos.y);
        livePosRef.current.delete(seatId);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleAddSeat = async () => {
    const usedPositions = new Set(localSeats.map(s => `${s.positionX},${s.positionY}`));
    let x = 60, y = 60;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (!usedPositions.has(`${x},${y}`)) break;
      x += SEAT_W + GRID;
      if (x + SEAT_W > CANVAS_W) { x = 60; y += SEAT_H + GRID; }
    }
    const newSeat = await api.seats.create('New seat', functionId, x, y);
    setLocalSeats(prev => [...prev, { ...newSeat, positionX: x, positionY: y }]);
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    await api.seats.delete(id);
    setLocalSeats(prev => prev.filter(s => s.id !== id));
    onUpdate();
  };

  const handleNameSubmit = async (id: number) => {
    if (!editName.trim()) { setEditingId(null); return; }
    const seat = localSeats.find(s => s.id === id);
    if (!seat) return;
    await api.seats.update(id, editName.trim(), seat.functionId);
    setLocalSeats(prev => prev.map(s => s.id === id ? { ...s, name: editName.trim() } : s));
    setEditingId(null);
  };

  const seatsWithPos = localSeats.filter(s => s.positionX != null && s.positionY != null);
  const noPosSeats = localSeats.filter(s => s.positionX == null || s.positionY == null);

  return (
    <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2 dark:text-gray-100">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
        {t('backoffice.seatMap')}
      </h3>

      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleAddSeat}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl transition-all
            bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-sm hover:shadow"
        >
          <Plus size={16} /> {t('backoffice.seatMapAddSeat')}
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{t('backoffice.seatMapDragHint')}</span>
      </div>

      <div
        ref={canvasRef}
        className="relative border dark:border-gray-600 rounded-xl overflow-hidden mb-4 select-none"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID}px ${GRID}px`,
        }}
      >
        {seatsWithPos.map(seat => (
          <div
            key={seat.id}
            onMouseDown={e => handleDragStart(e, seat.id)}
            className="absolute flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-grab active:cursor-grabbing
              bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30
              border border-cyan-200 dark:border-cyan-800
              hover:shadow-md hover:ring-2 hover:ring-cyan-400/40 transition-shadow group z-10"
            style={{
              left: seat.positionX ?? 0,
              top: seat.positionY ?? 0,
              width: SEAT_W,
              height: SEAT_H,
            }}
          >
            <GripHorizontal size={14} className="text-cyan-400 dark:text-cyan-600 flex-shrink-0" />
            {editingId === seat.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleNameSubmit(seat.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleNameSubmit(seat.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="w-full text-xs font-semibold bg-white/80 dark:bg-gray-700/80 px-1 py-0.5 rounded
                  border border-cyan-400 dark:border-cyan-600 focus:outline-none dark:text-white"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                className="flex-1 text-xs font-semibold truncate dark:text-gray-200 cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  setEditingId(seat.id);
                  setEditName(seat.name);
                }}
              >
                {seat.name}
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); handleDelete(seat.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              <Trash2 size={12} className="text-gray-400 hover:text-red-500" />
            </button>
          </div>
        ))}

        {seatsWithPos.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 dark:text-gray-600">
            {t('backoffice.seatMapNoSeats')}
          </div>
        )}
      </div>

      {noPosSeats.length > 0 && (
        <div className="border-t dark:border-gray-700 pt-3 mt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            {t('backoffice.seatMapUnplaced')}
          </p>
          <div className="flex flex-wrap gap-2">
            {noPosSeats.map(seat => (
              <div key={seat.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs">
                <span className="text-gray-600 dark:text-gray-300">{seat.name}</span>
                <button
                  onClick={async () => {
                    const idx = noPosSeats.indexOf(seat);
                    const x = 60 + (idx % 4) * (SEAT_W + GRID);
                    const y = 60 + Math.floor(idx / 4) * (SEAT_H + GRID);
                    await api.seats.updatePosition(seat.id, x, y);
                    setLocalSeats(prev => prev.map(s => s.id === seat.id ? { ...s, positionX: x, positionY: y } : s));
                  }}
                  className="text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                >
                  {t('backoffice.seatMapPlace')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
