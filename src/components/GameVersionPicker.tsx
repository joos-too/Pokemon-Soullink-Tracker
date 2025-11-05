import React from 'react';
import {GAME_VERSIONS} from '@/src/data/game-versions';

export type TileDef = { key: string; label: string; versionId: string };

type Group = { title: string; rows: TileDef[][] };

function buildGroupsFromGameVersions(): Group[] {
    const entries = Object.entries(GAME_VERSIONS);

    const getGenTitle = (id: string): string => {
        const m = /^gen(\d+)_/i.exec(id);
        return m ? `Gen. ${m[1]}` : 'Andere';
    };

    const map = new Map<string, TileDef[][]>();

    for (const [versionId, version] of entries) {
        const title = getGenTitle(versionId);

        const sc = (version as any)?.selectionColors as Record<string, {
            bgColor?: string;
            textColor?: string;
            borderColor?: string
        }> | undefined;
        const labels = sc ? Object.keys(sc) : [version.name];

        const row: TileDef[] = labels.map((label) => ({key: `${versionId}_${label}`, label, versionId}));

        if (!map.has(title)) map.set(title, []);
        map.get(title)!.push(row);
    }

    return Array.from(map.entries()).map(([title, rows]) => ({title, rows}));
}

export interface GameVersionPickerProps {
    value: string;
    onSelect: (versionId: string) => void;
}

const GameVersionPicker: React.FC<GameVersionPickerProps> = ({value, onSelect}) => {
    const groups = buildGroupsFromGameVersions();

    return (
        <div>
            <div className="space-y-3 max-h-64 overflow-y-auto overscroll-contain pr-1 custom-scrollbar px-0.5 pb-3">
                {groups.map((group) => (
                    <div key={group.title}>
                        <div className="flex items-center gap-3 mb-1.5">
                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"/>
                            <div
                                className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{group.title}</div>
                            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"/>
                        </div>
                        <div className="space-y-2 px-1">
                            {group.rows.map((row, rowIdx) => {
                                const rowVersionId = row[0]?.versionId;
                                const rowSelected = rowVersionId === value;
                                return (
                                    <button
                                        key={rowIdx}
                                        type="button"
                                        onClick={() => {
                                            if (rowVersionId) {
                                                onSelect(rowVersionId);
                                            }
                                        }}
                                        className={`
                                          group flex gap-1 w-full items-stretch
                                          rounded-md overflow-hidden
                                          ring-2 ${rowSelected ? 'ring-green-500' : 'ring-transparent hover:ring-gray-300 hover:shadow-sm'}
                                          focus:outline-none
                                          transition-shadow transition-colors
                                        `}
                                        aria-pressed={rowSelected}
                                        title={row.map(t => t.label).join(' | ')}
                                    >
                                        {row.map((tile, tileIdx) => {
                                            const version = GAME_VERSIONS[tile.versionId];
                                            const sc = (version as any)?.selectionColors?.[tile.label];
                                            const bgColor = sc?.bgColor || '#ffffff';
                                            const textColor = sc?.textColor || '#111827';
                                            const borderColor = sc?.borderColor || '#d1d5db';

                                            const isOnlyOne = row.length === 1;
                                            const isFirst = tileIdx === 0;
                                            const isLast = tileIdx === row.length - 1;

                                            const roundingClass = isOnlyOne
                                                ? 'rounded-md'
                                                : isFirst
                                                    ? 'rounded-l-md'
                                                    : isLast
                                                        ? 'rounded-r-md'
                                                        : '';

                                            const marginClass = !isFirst ? '-ml-px' : '';

                                            return (
                                                <div
                                                    key={tile.key}
                                                    className={`relative inline-flex items-center justify-center px-2 py-1.5 text-xs font-bold shadow-sm border flex-1 w-full ${roundingClass} ${marginClass} ${rowSelected ? 'z-10' : ''}`}
                                                    style={{
                                                        backgroundColor: bgColor,
                                                        color: textColor,
                                                        borderColor: borderColor
                                                    }}
                                                >
                                                    {tile.label}
                                                </div>
                                            );
                                        })}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameVersionPicker;
