import React, {useEffect, useMemo, useState} from 'react';
import P from '@/src/pokeapi';
import {EVOLUTIONS} from '@/src/data/pokemon-evolutions';
import {GERMAN_TO_ID as GERMAN_TO_ID_PRELOAD} from '@/src/data/pokemon-de-map';
import {getOfficialArtworkUrlById} from '@/src/services/sprites';

interface SelectEvolveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (player: 'player1' | 'player2', newName: string, newId: number) => void;
  pair: any | null;
  player1Label: string;
  player2Label: string;
}

interface EvoInfo {
  id: number;
  name: string; // German name if available, otherwise fallback from API
  artworkUrl?: string | null;
}

// Build reverse map id -> german name
const ID_TO_GERMAN: Record<number, string> = (() => {
  const out: Record<number, string> = {};
  Object.entries(GERMAN_TO_ID_PRELOAD).forEach(([k, v]) => {
    out[v] = k;
  });
  return out;
})();

function prettyName(raw: string) {
  if (!raw) return raw;
  // raw from GERMAN map is already lowercase; capitalize first letter
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

const SelectEvolveModal: React.FC<SelectEvolveModalProps> = ({isOpen, onClose, onConfirm, pair, player1Label, player2Label}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<'player1' | 'player2' | ''>('');
  const [availableEvos, setAvailableEvos] = useState<EvoInfo[] | null>(null);
  const [selectedEvoId, setSelectedEvoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlayer('');
      setAvailableEvos(null);
      setSelectedEvoId(null);
      setLoading(false);
    }
  }, [isOpen]);

  const currentName = useMemo(() => {
    if (!pair) return '';
    if (selectedPlayer === 'player1') return pair.player1.name || '';
    if (selectedPlayer === 'player2') return pair.player2.name || '';
    return '';
  }, [pair, selectedPlayer]);

  // when a player gets selected, compute evolutions
  useEffect(() => {
    async function loadEvos() {
      setAvailableEvos(null);
      setSelectedEvoId(null);
      if (!pair) return;
      const name = selectedPlayer === 'player1' ? pair.player1.name : pair.player2.name;
      if (!name) {
        setAvailableEvos([]);
        return;
      }
      const key = String(name).trim().toLowerCase();
      const numericId = (GERMAN_TO_ID_PRELOAD as Record<string, number>)[key];
      if (!numericId) {
        setAvailableEvos([]);
        return;
      }

      const evoIds = EVOLUTIONS[String(numericId)];
      if (!evoIds || evoIds.length === 0) {
        setAvailableEvos([]);
        return;
      }

      setLoading(true);
      try {
        const infos: EvoInfo[] = await Promise.all(evoIds.map(async (eid) => {
          try {
            const res = await P.getPokemonByName(String(eid));
            const art = res.sprites?.other?.['official-artwork']?.front_default || null;
            const german = ID_TO_GERMAN[eid] || '';
            return {id: eid, name: german ? prettyName(german) : (res.name ? prettyName(res.name) : String(eid)), artworkUrl: art};
          } catch (e) {
            // fallback to constructed artwork url and id-to-german map
            const art = getOfficialArtworkUrlById(eid);
            const german = ID_TO_GERMAN[eid] || '';
            return {id: eid, name: german ? prettyName(german) : String(eid), artworkUrl: art};
          }
        }));
        setAvailableEvos(infos);
      } finally {
        setLoading(false);
      }
    }

    if (selectedPlayer) loadEvos();
  }, [selectedPlayer, pair]);

  if (!isOpen) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer || selectedEvoId === null) return;
    const germanNameRaw = ID_TO_GERMAN[selectedEvoId] || '';
    const germanName = germanNameRaw ? prettyName(germanNameRaw) : String(selectedEvoId);
    onConfirm(selectedPlayer, germanName, selectedEvoId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* modal shell: limit overall height and hide overflow so inner area can scroll */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        {/* header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold dark:text-gray-100">Entwickeln</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200" aria-label="Schließen">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleConfirm} className="px-6 pb-6">
          {/* scrollable content area; keeps header and footer visible */}
          <div className="overflow-auto max-h-[60vh] pr-2 pt-4">
            {!selectedPlayer && (
              <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="mb-2">Welches Pok&eacute;mon soll entwickelt werden?</div>
                <label className="flex items-center gap-2 cursor-pointer dark:text-gray-200">
                  <input type="radio" name="which" value="player1" checked={selectedPlayer === 'player1'} onChange={() => setSelectedPlayer('player1')} className="h-4 w-4 accent-green-600"/>
                  <div>
                    <div className="font-semibold">{player1Label}</div>
                    <div className="text-sm">{pair?.player1?.name || '—'}{pair?.player1?.nickname ? ` (${pair.player1.nickname})` : ''}</div>
                  </div>
                </label>
                <label className="flex items-center gap-2 mt-3 cursor-pointer dark:text-gray-200">
                  <input type="radio" name="which" value="player2" checked={selectedPlayer === 'player2'} onChange={() => setSelectedPlayer('player2')} className="h-4 w-4 accent-green-600"/>
                  <div>
                    <div className="font-semibold">{player2Label}</div>
                    <div className="text-sm">{pair?.player2?.name || '—'}{pair?.player2?.nickname ? ` (${pair.player2.nickname})` : ''}</div>
                  </div>
                </label>
              </div>
            )}

            {selectedPlayer && (
              <div className="mb-4">
                <div className="font-semibold mb-2">{currentName} entwickeln?</div>

                {loading && <div className="text-sm text-gray-500">Lade Entwicklungen…</div>}

                {!loading && availableEvos && availableEvos.length === 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">Für dieses Pokémon sind keine Entwicklungen verfügbar.</div>
                )}

                {!loading && availableEvos && availableEvos.length > 0 && (
                  <div className="space-y-3">
                    {availableEvos.map((ev) => (
                      <label key={ev.id} className="flex items-center gap-3 cursor-pointer dark:text-gray-200">
                        <input type="radio" name="evo" value={ev.id} checked={selectedEvoId === ev.id} onChange={() => setSelectedEvoId(ev.id)} className="h-4 w-4 accent-green-600"/>
                        <img src={ev.artworkUrl || getOfficialArtworkUrlById(ev.id)} alt={ev.name} className="w-16 h-16 object-contain"/>
                        <div className="text-sm">{ev.name}</div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* footer buttons (kept visible) */}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Abbrechen</button>
            <button type="submit" disabled={!selectedPlayer || selectedEvoId === null} className={`px-4 py-2 rounded-md font-semibold shadow ${selectedEvoId ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}>
              Bestätigen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelectEvolveModal;
