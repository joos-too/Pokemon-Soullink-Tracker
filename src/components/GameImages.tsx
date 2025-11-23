import React from 'react';
import type {VariableRival, UserSettings} from '@/types';
import {getSpriteUrlForPokemonName} from '@/src/services/sprites';

// RivalImage component for displaying rival sprites
export const RivalImage: React.FC<{
    rival: string | VariableRival,
    preferences: UserSettings['rivalPreferences'],
    displayName?: string
}> = ({rival, preferences, displayName}) => {
    let spriteName: string;
    let fallbackDisplayName: string;

    if (typeof rival === 'string') {
        spriteName = rival.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
        fallbackDisplayName = rival;
    } else {
        const preference = preferences?.[rival.key] || 'male';
        spriteName = rival.options[preference];
        fallbackDisplayName = rival.name;
    }
    const resolvedDisplayName = displayName || fallbackDisplayName;

    const imagePath = `/rival-sprites/${spriteName}.png`;
    return <img
        src={imagePath}
        alt={resolvedDisplayName}
        title={resolvedDisplayName}
        className="w-8 h-8 object-contain mx-auto"
        style={{imageRendering: 'pixelated'}}
    />;
};

// Function to get badge URL based on arena label and position
export const getBadgeUrl = (arenaLabel: string, posIndex: number, badgeSet?: string): string => {
    const sanitize = (s: string) => s
        .toLowerCase()
        .replace(/ /g, '_')
        .replace(/ /g, '_')
        .replace(/[^a-z0-9_]/g, '');

    const raw = arenaLabel || '';
    const label = raw.toLowerCase();

    if (label.includes('top 4')) {
        const parts = raw.split('|');
        const name = parts[1]?.trim();
        if (name && name.length > 0) {
            const sprite = sanitize(name);
            return `/elite4-sprites/${sprite}.png`;
        }
    }

    if (label.includes('champ')) {
        const parts = raw.split('|');
        const name = parts[1]?.trim();
        if (name && name.length > 0) {
            const sprite = sanitize(name);
            return `/champ-sprites/${sprite}.png`;
        }
        const set = badgeSet;
        const pos = 8;
        return `/badge-sprites/${set}/${pos}.png`;
    }

    const set = badgeSet;
    const pos = Math.min(Math.max(posIndex + 1, 1), 8);
    return `/badge-sprites/${set}/${pos}.png`;
};

// BadgeImage component for displaying badge images
export const BadgeImage: React.FC<{
    arenaLabel: string,
    posIndex: number,
    badgeSet?: string,
    className?: string
}> = ({arenaLabel, posIndex, badgeSet, className = "w-8 h-8 object-contain"}) => {
    const badgeUrl = getBadgeUrl(arenaLabel, posIndex, badgeSet);
    const isPixelated = !arenaLabel.toLowerCase().includes('arena') ||
        arenaLabel.toLowerCase().includes('top 4') ||
        arenaLabel.toLowerCase().includes('champ');

    return (
        <img
            src={badgeUrl}
            alt={`${arenaLabel} Badge`}
            className={className}
            style={{imageRendering: isPixelated ? 'pixelated' : 'inherit'}}
        />
    );
};

// LegendaryImage component for displaying legendary Pokémon
export const LegendaryImage: React.FC<{
    pokemonName: string,
    className?: string,
    generationSpritePath?: string | null
}> = ({pokemonName, className = "w-16 h-16", generationSpritePath}) => {
    return (
        <img
            src={getSpriteUrlForPokemonName(pokemonName, generationSpritePath) || ""}
            alt=""
            className={className}
        />
    );
};
