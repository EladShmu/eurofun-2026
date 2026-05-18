import { useState, useEffect } from 'react';
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
  DragOverlay, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserData, RankedCountry } from '../types';
import { COUNTRY_MAP, flagUrl } from '../data/countries';

interface Props {
  userData: UserData;
  setUserData: React.Dispatch<React.SetStateAction<UserData>>;
  frozen?: boolean;
}

const SCORE_VALUES = [1, 2, 3, 4, 5];

function ScoreRow({
  label, value, onChange, disabled,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="ratings-row">
      <span className="ratings-label">{label}</span>
      <div className="score-buttons">
        {SCORE_VALUES.map(n => (
          <button
            key={n}
            data-score={n}
            className={`score-btn ${value === n ? 'active' : ''}`}
            onClick={() => onChange(n)}
            disabled={disabled}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SortableRankedCard({
  rc, rank, total, onUpdate, onRemove, onMoveToPosition, frozen, collapsed, onToggleCollapsed,
}: {
  rc: RankedCountry;
  rank: number;
  total: number;
  onUpdate: (field: keyof RankedCountry, val: string | number | null) => void;
  onRemove: () => void;
  onMoveToPosition: (targetRank: number) => void;
  frozen: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const country = COUNTRY_MAP[rc.countryId];
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [posInput, setPosInput] = useState(String(rank));

  useEffect(() => {
    setPosInput(String(rank));
  }, [rank]);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: rc.countryId, disabled: frozen });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const rankClass = rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : '';

  return (
    <div ref={setNodeRef} style={style} className={`ranked-card ${collapsed ? 'collapsed' : ''} ${rankClass}`}>
      <div className="ranked-card-top">
        <input
          type="number"
          className="rank-position-input"
          min={1}
          max={total}
          value={posInput}
          disabled={frozen}
          onChange={e => setPosInput(e.target.value)}
          onFocus={e => { setPosInput(String(rank)); e.target.select(); }}
          onBlur={e => {
            const n = parseInt(e.target.value);
            if (!isNaN(n)) onMoveToPosition(n);
            setPosInput(String(rank));
          }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        />
        <div className="ranked-card-name-area" onClick={onToggleCollapsed}>
          <img
            src={flagUrl(country.isoCode)}
            className="flag-img"
            alt={country.name}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="country-name">{country.name}</span>
          <span className="collapse-arrow">{collapsed ? '▸' : '▾'}</span>
        </div>

        <span className="perf-order-wrap">
          <span className="perf-order-label">הופעה</span>
          <input
            className="perf-order-input"
            type="number"
            min={1}
            max={25}
            value={rc.addedOrder}
            disabled={frozen}
            onChange={e => onUpdate('addedOrder', parseInt(e.target.value) || 1)}
          />
        </span>

        {!frozen && (confirmRemove ? (
          <span className="confirm-row">
            <span className="confirm-text">בטוח?</span>
            <button className="confirm-yes" onClick={onRemove}>כן</button>
            <button className="confirm-no" onClick={() => setConfirmRemove(false)}>לא</button>
          </span>
        ) : (
          <button className="remove-btn" onClick={() => setConfirmRemove(true)} title="החזר לבריכה">✕</button>
        ))}

        {!frozen && <span className="drag-handle" {...attributes} {...listeners}>⠿</span>}
      </div>

      {!collapsed && (
        <>
          <textarea
            className="card-textarea"
            placeholder="תאר את ההופעה... 🎤"
            value={rc.description}
            disabled={frozen}
            onChange={e => onUpdate('description', e.target.value)}
            rows={2}
          />
          <textarea
            className="card-textarea notes"
            placeholder="הערות (קהל? מקוריות? סיכוי?) 💭"
            value={rc.notes}
            disabled={frozen}
            onChange={e => onUpdate('notes', e.target.value)}
            rows={2}
          />
          <ScoreRow
            label="⭐ דירוג אישי"
            value={rc.personalScore}
            onChange={v => onUpdate('personalScore', v)}
            disabled={frozen}
          />
          <ScoreRow
            label="👥 הקהל יאהב"
            value={rc.audienceScore}
            onChange={v => onUpdate('audienceScore', v)}
            disabled={frozen}
          />
          <ScoreRow
            label="⚖️ השופטים יאהבו"
            value={rc.judgeScore}
            onChange={v => onUpdate('judgeScore', v)}
            disabled={frozen}
          />
        </>
      )}
    </div>
  );
}

function PoolCard({ countryId, onAdd, frozen }: { countryId: string; onAdd: () => void; frozen: boolean }) {
  const country = COUNTRY_MAP[countryId];
  return (
    <div className={`pool-card ${frozen ? 'frozen' : ''}`} onClick={() => { if (!frozen) onAdd(); }}>
      <span className="perf-num">{country.performanceOrder}</span>
      <img
        src={flagUrl(country.isoCode)}
        className="flag-img"
        alt={country.name}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <span className="pool-name">{country.name}</span>
      <span className="add-btn">+</span>
    </div>
  );
}

function DragPreview({ countryId }: { countryId: string | null }) {
  if (!countryId) return null;
  const country = COUNTRY_MAP[countryId];
  return (
    <div className="drag-preview">
      {country.flag} {country.name}
    </div>
  );
}

export default function MainPage({ userData, setUserData, frozen = false }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  const [poolVisible, setPoolVisible] = useState(true);
  const [showTopOnly, setShowTopOnly] = useState(false);

  function toggleCardCollapsed(countryId: string) {
    setCollapsedCards(prev => {
      const next = new Set(prev);
      if (next.has(countryId)) next.delete(countryId);
      else next.add(countryId);
      return next;
    });
  }

  function toggleAllCollapsed() {
    if (collapsedCards.size < userData.rankedList.length) {
      setCollapsedCards(new Set(userData.rankedList.map(rc => rc.countryId)));
    } else {
      setCollapsedCards(new Set());
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function nextAddedOrder(): number {
    if (userData.rankedList.length === 0) return 1;
    return Math.max(...userData.rankedList.map(r => r.addedOrder)) + 1;
  }

  function fillRandom() {
    if (userData.pool.length === 0) return;
    const shuffled = [...userData.pool].sort(() => Math.random() - 0.5);
    let order = nextAddedOrder();
    const newEntries: RankedCountry[] = shuffled.map(id => ({
      countryId: id,
      description: '',
      notes: '',
      addedOrder: order++,
      personalScore: null,
      audienceScore: null,
      judgeScore: null,
    }));
    setUserData(prev => ({
      ...prev,
      pool: [],
      rankedList: [...prev.rankedList, ...newEntries],
      lastUpdated: Date.now(),
    }));
  }

  function shuffleRanked() {
    if (userData.rankedList.length === 0) return;
    setUserData(prev => ({
      ...prev,
      rankedList: [...prev.rankedList].sort(() => Math.random() - 0.5),
      lastUpdated: Date.now(),
    }));
  }

  function clearAll() {
    setUserData(prev => ({
      ...prev,
      pool: [...prev.pool, ...prev.rankedList.map(rc => rc.countryId)],
      rankedList: [],
      lastUpdated: Date.now(),
    }));
    setConfirmClear(false);
  }

  function addToRanked(countryId: string) {
    setCollapsedCards(prev => { const next = new Set(prev); next.add(countryId); return next; });
    setUserData(prev => ({
      ...prev,
      pool: prev.pool.filter(id => id !== countryId),
      rankedList: [...prev.rankedList, {
        countryId,
        description: '',
        notes: '',
        addedOrder: nextAddedOrder(),
        personalScore: null,
        audienceScore: null,
        judgeScore: null,
      }],
      lastUpdated: Date.now(),
    }));
  }

  function removeFromRanked(countryId: string) {
    setCollapsedCards(prev => { const next = new Set(prev); next.delete(countryId); return next; });
    setUserData(prev => ({
      ...prev,
      rankedList: prev.rankedList.filter(rc => rc.countryId !== countryId),
      pool: [...prev.pool, countryId],
      lastUpdated: Date.now(),
    }));
  }

  function updateField(countryId: string, field: keyof RankedCountry, val: string | number | null) {
    setUserData(prev => ({
      ...prev,
      rankedList: prev.rankedList.map(rc =>
        rc.countryId === countryId ? { ...rc, [field]: val } : rc
      ),
      lastUpdated: Date.now(),
    }));
  }

  function moveToPosition(countryId: string, targetRank: number) {
    setUserData(prev => {
      const list = prev.rankedList;
      const currentIndex = list.findIndex(rc => rc.countryId === countryId);
      if (currentIndex === -1) return prev;
      const targetIndex = Math.max(0, Math.min(list.length - 1, targetRank - 1));
      if (currentIndex === targetIndex) return prev;
      const next = [...list];
      const [item] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, item);
      return { ...prev, rankedList: next, lastUpdated: Date.now() };
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setUserData(prev => {
      const oldIndex = prev.rankedList.findIndex(rc => rc.countryId === active.id);
      const newIndex = prev.rankedList.findIndex(rc => rc.countryId === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return { ...prev, rankedList: arrayMove(prev.rankedList, oldIndex, newIndex), lastUpdated: Date.now() };
    });
  }

  const poolSorted = [...userData.pool].sort((a, b) =>
    COUNTRY_MAP[a].performanceOrder - COUNTRY_MAP[b].performanceOrder
  );

  const displayedRanked = showTopOnly
    ? userData.rankedList.slice(0, 10)
    : userData.rankedList;

  return (
    <div className="main-page">
      {frozen && (
        <div className="frozen-banner">🔒 הדירוגים קפואים — לא ניתן לערוך</div>
      )}
      <section className="ranked-section">
        <div className="ranked-section-header">
          <h2 className="section-title">🏆 הדירוג שלי ({userData.rankedList.length})</h2>
          <div className="ranked-actions">
            {userData.rankedList.length > 0 && (
              <>
                <button
                  className={`action-btn ${showTopOnly ? 'active-toggle' : ''}`}
                  onClick={() => setShowTopOnly(v => !v)}
                  title="החלף בין טופ 10 לכל המדינות"
                >
                  {showTopOnly ? '📋 כל המדינות' : '🔟 TOP 10'}
                </button>
                <button className="action-btn" onClick={toggleAllCollapsed} title="כווץ / הרחב את כל הכרטיסים">
                  {collapsedCards.size === userData.rankedList.length ? '▸ הרחב הכל' : '▾ כווץ הכל'}
                </button>
              </>
            )}
            {!frozen && (
              <>
                {userData.pool.length > 0 && (
                  <button className="action-btn" onClick={fillRandom} title="הוסף את כל המדינות מהפול בסדר אקראי">
                    🎲 מלא הכל
                  </button>
                )}
                {userData.rankedList.length > 1 && (
                  <button className="action-btn" onClick={shuffleRanked} title="ערבב מחדש את הסדר">
                    🔀 ערבב
                  </button>
                )}
                {userData.rankedList.length > 0 && (
                  confirmClear ? (
                    <span className="confirm-row">
                      <span className="confirm-text">למחוק הכל?</span>
                      <button className="confirm-yes" onClick={clearAll}>כן</button>
                      <button className="confirm-no" onClick={() => setConfirmClear(false)}>לא</button>
                    </span>
                  ) : (
                    <button className="action-btn danger" onClick={() => setConfirmClear(true)} title="החזר הכל לפול">
                      🗑️ נקה
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
        {userData.rankedList.length === 0 && (
          <p className="empty-hint">לחץ על מדינה למטה כדי להוסיף אותה לדירוג ⬇️</p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayedRanked.map(rc => rc.countryId)}
            strategy={verticalListSortingStrategy}
          >
            {displayedRanked.map((rc, i) => (
              <SortableRankedCard
                key={rc.countryId}
                rc={rc}
                rank={i + 1}
                total={userData.rankedList.length}
                onUpdate={(field, val) => updateField(rc.countryId, field, val)}
                onRemove={() => removeFromRanked(rc.countryId)}
                onMoveToPosition={targetRank => moveToPosition(rc.countryId, targetRank)}
                frozen={frozen}
                collapsed={collapsedCards.has(rc.countryId)}
                onToggleCollapsed={() => toggleCardCollapsed(rc.countryId)}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            <DragPreview countryId={activeId} />
          </DragOverlay>
        </DndContext>
        {showTopOnly && userData.rankedList.length > 10 && (
          <p className="top-only-hint">מוצגות {displayedRanked.length} מדינות מתוך {userData.rankedList.length} — <button className="inline-link-btn" onClick={() => setShowTopOnly(false)}>הצג הכל</button></p>
        )}
      </section>

      {poolSorted.length > 0 && (
        <section className="pool-section">
          <div className="pool-section-header">
            <h2 className="section-title">🗂️ ממתינות ({poolSorted.length})</h2>
            <button className="action-btn" onClick={() => setPoolVisible(v => !v)}>
              {poolVisible ? '▾ הסתר' : '▸ הצג'}
            </button>
          </div>
          {poolVisible && (
            <div className="pool-grid">
              {poolSorted.map(id => (
                <PoolCard key={id} countryId={id} onAdd={() => addToRanked(id)} frozen={frozen} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
