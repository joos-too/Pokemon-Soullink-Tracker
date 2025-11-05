import type {GameVersion} from '@/types';

export const GAME_VERSIONS: Record<string, GameVersion> = {
    gen1_rb: {
        id: 'gen1_rb',
        name: 'Pokémon Rot / Blau',
        badgeSet: 'gen1/rbg',
        badge: {
            segments: [
                {text: 'R', bgColor: '#ff6b6b', textColor: '#000000', borderColor: '#5c0000'},
                {text: 'B', bgColor: '#1d89e4', textColor: '#000000', borderColor: '#053b78'},
            ],
        },
        selectionColors: {
            'Rot': { bgColor: '#f44236', textColor: '#000000', borderColor: '#f44236' },
            'Blau': { bgColor: '#1d89e4', textColor: '#000000', borderColor: '#1d89e4' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '12'},
            {id: 2, arena: '2. Arena', level: '21'},
            {id: 3, arena: '3. Arena', level: '24'},
            {id: 4, arena: '4. Arena', level: '29'},
            {id: 5, arena: '5. Arena', level: '43'},
            {id: 6, arena: '6. Arena', level: '43'},
            {id: 7, arena: '7. Arena', level: '47'},
            {id: 8, arena: '8. Arena', level: '50'},
            {id: 9, arena: 'Top 4', level: '58'},
            {id: 10, arena: 'Champ', level: '65'},
        ],
        rivalCaps: [
            {id: 1, location: 'Azuria City', rival: 'Blau', level: '18'},
            {id: 2, location: 'M.S. Anne', rival: 'Blau', level: '19'},
            {id: 3, location: 'Pokémon-Turm', rival: 'Blau', level: '25'},
            {id: 4, location: 'Silph Co.', rival: 'Blau', level: '40'},
            {id: 5, location: 'Route 22', rival: 'Blau', level: '53'},
        ],
        champion: {name: 'Blau', sprite: '/champ-sprites/blau.png'},
    },
    gen1_g: {
        id: 'gen1_g',
        name: 'Pokémon Gelb',
        badgeSet: 'gen1/rbg',
        badge: {
            segments: [
                {text: 'G', bgColor: '#ffff00', textColor: '#000000', borderColor: '#766a00'},
            ],
        },
        selectionColors: {
            'Gelb': { bgColor: '#ffbe00', textColor: '#000000', borderColor: '#ffbe00' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '12'},
            {id: 2, arena: '2. Arena', level: '21'},
            {id: 3, arena: '3. Arena', level: '24'},
            {id: 4, arena: '4. Arena', level: '29'},
            {id: 5, arena: '5. Arena', level: '43'},
            {id: 6, arena: '6. Arena', level: '43'},
            {id: 7, arena: '7. Arena', level: '47'},
            {id: 8, arena: '8. Arena', level: '50'},
            {id: 9, arena: 'Top 4', level: '58'},
            {id: 10, arena: 'Champ', level: '65'},
        ],
        rivalCaps: [
            {id: 1, location: 'Azuria City', rival: 'Blau', level: '18'},
            {id: 2, location: 'M.S. Anne', rival: 'Blau', level: '19'},
            {id: 3, location: 'Pokémon-Turm', rival: 'Blau', level: '25'},
            {id: 4, location: 'Silph Co.', rival: 'Blau', level: '40'},
            {id: 5, location: 'Route 22', rival: 'Blau', level: '53'},
        ],
        champion: {name: 'Blau', sprite: '/champ-sprites/blau.png'},
    },
    gen2_gs: {
        id: 'gen2_gs',
        name: 'Pokémon Gold / Silber',
        badgeSet: 'gen2/gsk',
        badge: {
            segments: [
                {text: 'G', bgColor: '#d3af37', textColor: '#000000', borderColor: '#786200'},
                {text: 'S', bgColor: '#b0bfc6', textColor: '#000000', borderColor: '#5a686e'},
            ],
        },
        selectionColors: {
            'Gold': { bgColor: '#d3af37', textColor: '#000000', borderColor: '#d3af37' },
            'Silber': { bgColor: '#b0bfc6', textColor: '#000000', borderColor: '#b0bfc6' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '9'},
            {id: 2, arena: '2. Arena', level: '16'},
            {id: 3, arena: '3. Arena', level: '20'},
            {id: 4, arena: '4. Arena', level: '25'},
            {id: 5, arena: '5. Arena', level: '30'},
            {id: 6, arena: '6. Arena', level: '31'},
            {id: 7, arena: '7. Arena', level: '35'},
            {id: 8, arena: '8. Arena', level: '40'},
            {id: 9, arena: 'Top 4', level: '47'},
            {id: 10, arena: 'Champ', level: '50'},
        ],
        rivalCaps: [
            {id: 1, location: 'Azetalea City', rival: 'Silber', level: '18'},
            {id: 2, location: 'Turmruine', rival: 'Silber', level: '22'},
            {id: 3, location: 'Radioturm (Dukatia City)', rival: 'Silber', level: '34'},
            {id: 4, location: 'Siegesstraße', rival: 'Silber', level: '40'},
        ],
        champion: {name: 'Siegfried', sprite: '/champ-sprites/siegfried.png'},
    },
    gen2_k: {
        id: 'gen2_k',
        name: 'Pokémon Kristall',
        badgeSet: 'gen2/gsk',
        badge: {
            segments: [
                {text: 'K', bgColor: '#87cefa', textColor: '#000000', borderColor: '#064973'},
            ],
        },
        selectionColors: {
            'Kristall': { bgColor: '#4dd0e2', textColor: '#000000', borderColor: '#4dd0e2' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '9'},
            {id: 2, arena: '2. Arena', level: '16'},
            {id: 3, arena: '3. Arena', level: '20'},
            {id: 4, arena: '4. Arena', level: '25'},
            {id: 5, arena: '5. Arena', level: '30'},
            {id: 6, arena: '6. Arena', level: '31'},
            {id: 7, arena: '7. Arena', level: '35'},
            {id: 8, arena: '8. Arena', level: '40'},
            {id: 9, arena: 'Top 4', level: '47'},
            {id: 10, arena: 'Champ', level: '50'},
        ],
        rivalCaps: [
            {id: 1, location: 'Azetalea City', rival: 'Silber', level: '18'},
            {id: 2, location: 'Turmruine', rival: 'Silber', level: '22'},
            {id: 3, location: 'Radioturm (Dukatia City)', rival: 'Silber', level: '34'},
            {id: 4, location: 'Siegesstraße', rival: 'Silber', level: '40'},
        ],
        champion: {name: 'Siegfried', sprite: '/champ-sprites/siegfried.png'},
    },
    gen3_rusa: {
        id: 'gen3_rusa',
        name: 'Pokémon Rubin / Saphir',
        badgeSet: 'gen3/rusasm',
        badge: {
            segments: [
                {text: 'RU', bgColor: '#bf0109', textColor: '#ffffff', borderColor: '#490004'},
                {text: 'SA', bgColor: '#3862ae', textColor: '#ffffff', borderColor: '#072660'},
            ],
        },
        selectionColors: {
            'Rubin': { bgColor: '#cf0304', textColor: '#ffffff', borderColor: '#cf0304' },
            'Saphir': { bgColor: '#3c3696', textColor: '#ffffff', borderColor: '#3c3696' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '15'},
            {id: 2, arena: '2. Arena', level: '19'},
            {id: 3, arena: '3. Arena', level: '23'},
            {id: 4, arena: '4. Arena', level: '28'},
            {id: 5, arena: '5. Arena', level: '31'},
            {id: 6, arena: '6. Arena', level: '33'},
            {id: 7, arena: '7. Arena', level: '42'},
            {id: 8, arena: '8. Arena', level: '46'},
            {id: 9, arena: 'Top 4', level: '55'},
            {id: 10, arena: 'Champ', level: '58'},
        ],
        rivalCaps: [
            {id: 1, location: 'Malvenfroh City', rival: 'Heiko', level: '16'},
            {
                id: 2,
                location: 'Route 110',
                rival: {name: 'Brix / Maike', key: 'brix_maike', options: {male: 'brix', female: 'maike'}},
                level: '20'
            },
            {
                id: 3,
                location: 'Seegrasulb City',
                rival: {name: 'Brix / Maike', key: 'brix_maike', options: {male: 'brix', female: 'maike'}},
                level: '34'
            },
            {id: 4, location: 'Siegesstraße', rival: 'Heiko', level: '45'},
        ],
        champion: {name: 'Wassili', sprite: '/champ-sprites/wassili.png'},
    },
    gen3_sm: {
        id: 'gen3_sm',
        name: 'Pokémon Smaragd',
        badgeSet: 'gen3/rusasm',
        badge: {
            segments: [
                {text: 'SM', bgColor: '#017f3f', textColor: '#ffffff', borderColor: '#033d1d'},
            ],
        },
        selectionColors: {
            'Smaragd': { bgColor: '#078347', textColor: '#ffffff', borderColor: '#078347' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '15'},
            {id: 2, arena: '2. Arena', level: '19'},
            {id: 3, arena: '3. Arena', level: '23'},
            {id: 4, arena: '4. Arena', level: '28'},
            {id: 5, arena: '5. Arena', level: '31'},
            {id: 6, arena: '6. Arena', level: '33'},
            {id: 7, arena: '7. Arena', level: '42'},
            {id: 8, arena: '8. Arena', level: '46'},
            {id: 9, arena: 'Top 4', level: '55'},
            {id: 10, arena: 'Champ', level: '58'},
        ],
        rivalCaps: [
            {id: 1, location: 'Malvenfroh City', rival: 'Heiko', level: '16'},
            {
                id: 2,
                location: 'Route 110',
                rival: {name: 'Brix / Maike', key: 'brix_maike', options: {male: 'brix', female: 'maike'}},
                level: '20'
            },
            {
                id: 3,
                location: 'Seegrasulb City',
                rival: {name: 'Brix / Maike', key: 'brix_maike', options: {male: 'brix', female: 'maike'}},
                level: '34'
            },
            {id: 4, location: 'Siegesstraße', rival: 'Heiko', level: '45'},
        ],
        champion: {name: 'Wassili', sprite: '/champ-sprites/wassili.png'},
    },
    gen3_frbg: {
        id: 'gen3_frbg',
        name: 'Pokémon Feuerrot / Blattgrün',
        badgeSet: 'gen1/rbg',
        badge: {
            segments: [
                {text: 'FR', bgColor: '#dd7521', textColor: '#000000', borderColor: '#930707'},
                {text: 'BG', bgColor: '#b9d101', textColor: '#000000', borderColor: '#738205'},
            ],
        },
        selectionColors: {
            'Feuerrot': { bgColor: '#f44236', textColor: '#000000', borderColor: '#f44236' },
            'Blattgrün': { bgColor: '#4cb050', textColor: '#000000', borderColor: '#4cb050' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '14'},
            {id: 2, arena: '2. Arena', level: '21'},
            {id: 3, arena: '3. Arena', level: '24'},
            {id: 4, arena: '4. Arena', level: '29'},
            {id: 5, arena: '5. Arena', level: '43'},
            {id: 6, arena: '6. Arena', level: '43'},
            {id: 7, arena: '7. Arena', level: '47'},
            {id: 8, arena: '8. Arena', level: '50'},
            {id: 9, arena: 'Top 4', level: '59'},
            {id: 10, arena: 'Champ', level: '63'},
        ],
        rivalCaps: [
            {id: 1, location: 'Azuria City', rival: 'Blau', level: '17'},
            {id: 2, location: 'M.S. Anne', rival: 'Blau', level: '19'},
            {id: 3, location: 'Pokémon-Turm', rival: 'Blau', level: '25'},
            {id: 4, location: 'Silph Co.', rival: 'Blau', level: '40'},
            {id: 5, location: 'Route 22', rival: 'Blau', level: '53'},
        ],
        champion: {name: 'Blau', sprite: '/champ-sprites/blau.png'},
    },
    gen4_dp: {
        id: 'gen4_dp',
        name: 'Pokémon Diamant / Perl',
        badgeSet: 'gen4/dppt',
        badge: {
            segments: [
                {text: 'D', bgColor: '#00bcd5', textColor: '#ffffff', borderColor: '#007c8b'},
                {text: 'P', bgColor: '#aa47bc', textColor: '#ffffff', borderColor: '#6e2e78'},
            ],
        },
        selectionColors: {
            'Diamant': { bgColor: '#00bcd5', textColor: '#ffffff', borderColor: '#00bcd5' },
            'Perl': { bgColor: '#aa47bc', textColor: '#ffffff', borderColor: '#aa47bc' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '14'},
            {id: 2, arena: '2. Arena', level: '22'},
            {id: 3, arena: '3. Arena', level: '26'},
            {id: 4, arena: '4. Arena', level: '32'},
            {id: 5, arena: '5. Arena', level: '36'},
            {id: 6, arena: '6. Arena', level: '41'},
            {id: 7, arena: '7. Arena', level: '44'},
            {id: 8, arena: '8. Arena', level: '50'},
            {id: 9, arena: 'Top 4', level: '57'},
            {id: 10, arena: 'Champ', level: '62'},
        ],
        rivalCaps: [
            {id: 1, location: 'Herzhofen', rival: 'Barry', level: '20'},
            {id: 2, location: 'Weideburg', rival: 'Barry', level: '31'},
            {id: 3, location: 'Fleetburg', rival: 'Barry', level: '38'},
            {id: 4, location: 'Pokémon Liga (Eingang)', rival: 'Barry', level: '48'},
        ],
        champion: {name: 'Cynthia', sprite: '/champ-sprites/cynthia.png'},
    },
    gen4_pt: {
        id: 'gen4_pt',
        name: 'Pokémon Platin',
        badgeSet: 'gen4/dppt',
        badge: {
            segments: [
                {text: 'P', bgColor: '#aabbd1', textColor: '#000000', borderColor: '#6f5454'},
            ],
        },
        selectionColors: {
            'Platin': { bgColor: '#c9c1b6', textColor: '#000000', borderColor: '#c9c1b6' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '14'},
            {id: 2, arena: '2. Arena', level: '22'},
            {id: 3, arena: '3. Arena', level: '26'},
            {id: 4, arena: '4. Arena', level: '32'},
            {id: 5, arena: '5. Arena', level: '36'},
            {id: 6, arena: '6. Arena', level: '41'},
            {id: 7, arena: '7. Arena', level: '44'},
            {id: 8, arena: '8. Arena', level: '50'},
            {id: 9, arena: 'Top 4', level: '57'},
            {id: 10, arena: 'Champ', level: '62'},
        ],
        rivalCaps: [
            {id: 1, location: 'Herzhofen', rival: 'Barry', level: '20'},
            {id: 2, location: 'Weideburg', rival: 'Barry', level: '31'},
            {id: 3, location: 'Fleetburg', rival: 'Barry', level: '38'},
            {id: 4, location: 'Pokémon Liga (Eingang)', rival: 'Barry', level: '48'},
        ],
        champion: {name: 'Cynthia', sprite: '/champ-sprites/cynthia.png'},
    },
    gen4_hgss: {
        id: 'gen4_hgss',
        name: 'Pokémon HeartGold / SoulSilver',
        badgeSet: 'gen2/gsk',
        badge: {
            segments: [
                {text: 'HG', bgColor: '#eedd82', textColor: '#000000', borderColor: '#877b37'},
                {text: 'SS', bgColor: '#b9d3ee', textColor: '#3f566f', borderColor: '#3f566f'},
            ],
        },
        selectionColors: {
            'Heart Gold': { bgColor: '#d3af37', textColor: '#ffffff', borderColor: '#d3af37' },
            'Soul Silver': { bgColor: '#b0bfc6', textColor: '#ffffff', borderColor: '#b0bfc6' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '13'},
            {id: 2, arena: '2. Arena', level: '17'},
            {id: 3, arena: '3. Arena', level: '21'},
            {id: 4, arena: '4. Arena', level: '25'},
            {id: 5, arena: '5. Arena', level: '31'},
            {id: 6, arena: '6. Arena', level: '34'},
            {id: 7, arena: '7. Arena', level: '35'},
            {id: 8, arena: '8. Arena', level: '41'},
            {id: 9, arena: 'Top 4', level: '47'},
            {id: 10, arena: 'Champ', level: '50'},
        ],
        rivalCaps: [
            {id: 1, location: 'Azetalea City', rival: 'Silber', level: '18'},
            {id: 2, location: 'Turmruine', rival: 'Silber', level: '22'},
            {id: 3, location: 'Team Rocket Versteck', rival: 'Silber', level: '34'},
            {id: 4, location: 'Siegesstraße', rival: 'Silber', level: '40'},
        ],
        champion: {name: 'Siegfried', sprite: '/champ-sprites/siegfried.png'},
    },
    gen5_sw: {
        id: 'gen5_sw',
        name: 'Pokémon Schwarz / Weiß',
        badgeSet: 'gen5/sw',
        badge: {
            segments: [
                {text: 'S', bgColor: '#000000', textColor: '#ffffff', borderColor: '#000000'},
                {text: 'W', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000'},
            ],
        },
        selectionColors: {
            'Schwarz': { bgColor: '#424242', textColor: '#ffffff', borderColor: '#424242' },
            'Weiß': { bgColor: '#eeeeee', textColor: '#000000', borderColor: '#eeeeee' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '14/12'},
            {id: 2, arena: '2. Arena', level: '20/18'},
            {id: 3, arena: '3. Arena', level: '23/21'},
            {id: 4, arena: '4. Arena', level: '27/25'},
            {id: 5, arena: '5. Arena', level: '31/29'},
            {id: 6, arena: '6. Arena', level: '35/33'},
            {id: 7, arena: '7. Arena', level: '39/37'},
            {id: 8, arena: '8. Arena', level: '43/31'},
            {id: 9, arena: 'Top 4', level: '50/48'},
            {id: 10, arena: 'Champ', level: '52/50'},
        ],
        rivalCaps: [
            {id: 1, location: 'Route 2', rival: 'Bell', level: '6'},
            {id: 2, location: 'Gavina', rival: 'N', level: '7'},
            {id: 3, location: 'Orion City', rival: 'Cheren', level: '8'},
            {id: 4, location: 'Septerna City', rival: 'N', level: '13'},
            {id: 5, location: 'Route 3', rival: 'Cheren', level: '14'},
            {id: 6, location: 'Route 4', rival: 'Bell', level: '18'},
            {id: 7, location: 'Route 4', rival: 'Cheren', level: '20'},
            {id: 8, location: 'Rayono City', rival: 'N', level: '22'},
            {id: 9, location: 'Route 5', rival: 'Cheren', level: '24'},
            {id: 10, location: 'Marea City', rival: 'Bell', level: '26'},
            {id: 11, location: 'Elektrolithhöhle', rival: 'N', level: '28'},
            {id: 12, location: 'Wendelberg', rival: 'Cheren', level: '33'},
            {id: 13, location: 'Route 8', rival: 'Bell', level: '38'},
            {id: 14, location: 'Route 10', rival: 'Cheren', level: '43'},
        ],
        champion: {name: 'Lauro', sprite: '/champ-sprites/lauro.png'},
    },
    gen5_s2w2: {
        id: 'gen5_s2w2',
        name: 'Pokémon Schwarz 2 / Weiß 2',
        badgeSet: 'gen5/s2w2',
        badge: {
            segments: [
                {text: 'S2', bgColor: '#000000', textColor: '#bbe7ff', borderColor: '#3f566f'},
                {text: 'W2', bgColor: '#ffffff', textColor: '#dd151b', borderColor: '#ed1c24'},
            ],
        },
        selectionColors: {
            'Schwarz 2': { bgColor: '#424242', textColor: '#ffffff', borderColor: '#424242' },
            'Weiß 2': { bgColor: '#eeeeee', textColor: '#000000', borderColor: '#eeeeee' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '13'},
            {id: 2, arena: '2. Arena', level: '18'},
            {id: 3, arena: '3. Arena', level: '24'},
            {id: 4, arena: '4. Arena', level: '30'},
            {id: 5, arena: '5. Arena', level: '39'},
            {id: 6, arena: '6. Arena', level: '48'},
            {id: 7, arena: '7. Arena', level: '51'},
            {id: 8, arena: '8. Arena', level: '53'},
            {id: 9, arena: 'Top 4', level: '58'},
            {id: 10, arena: 'Champ', level: '62'},
        ],
        rivalCaps: [
            {id: 1, location: 'Eventura-Farm', rival: 'Matisse', level: '8'},
            {id: 2, location: 'Route 20', rival: 'Matisse', level: '14'},
            {id: 3, location: 'Pokémon World Tournament', rival: 'Matisse', level: '25'},
            {id: 4, location: 'Route 22', rival: 'Matisse', level: '40'},
            {id: 5, location: 'Plasma-Fregatte', rival: 'Matisse', level: '50'},
            {id: 6, location: 'Siegesstraße', rival: 'Matisse', level: '55'},
        ],
        champion: {name: 'Lilia', sprite: '/champ-sprites/lilia.png'},
    },
    gen6_xy: {
        id: 'gen6_xy',
        name: 'Pokémon X / Y',
        badgeSet: 'gen6/xy',
        badge: {
            segments: [
                {text: 'X', bgColor: '#dff3f4', textColor: '#005e9b', borderColor: '#005e9b'},
                {text: 'Y', bgColor: '#e9b2bf', textColor: '#871223', borderColor: '#871223'},
            ],
        },
        selectionColors: {
            'X': { bgColor: '#325ca6', textColor: '#ffffff', borderColor: '#325ca6' },
            'Y': { bgColor: '#d41235', textColor: '#ffffff', borderColor: '#d41235' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '12'},
            {id: 2, arena: '2. Arena', level: '25'},
            {id: 3, arena: '3. Arena', level: '32'},
            {id: 4, arena: '4. Arena', level: '34'},
            {id: 5, arena: '5. Arena', level: '40'},
            {id: 6, arena: '6. Arena', level: '44'},
            {id: 7, arena: '7. Arena', level: '48'},
            {id: 8, arena: '8. Arena', level: '59'},
            {id: 9, arena: 'Top 4', level: '65'},
            {id: 10, arena: 'Champ', level: '68'},
        ],
        rivalCaps: [
            {
                id: 1,
                location: 'Route 7',
                rival: {name: 'Kalem / Serena', key: 'kalem_serena', options: {male: 'kalem', female: 'serena'}},
                level: '14'
            },
            {
                id: 2,
                location: 'Turm der Erkenntnis',
                rival: {name: 'Kalem / Serena', key: 'kalem_serena', options: {male: 'kalem', female: 'serena'}},
                level: '28'
            },
            {
                id: 3,
                location: 'Geosenge',
                rival: {name: 'Kalem / Serena', key: 'kalem_serena', options: {male: 'kalem', female: 'serena'}},
                level: '31'
            },
            {
                id: 4,
                location: 'Tempera City',
                rival: {name: 'Kalem / Serena', key: 'kalem_serena', options: {male: 'kalem', female: 'serena'}},
                level: '46'
            },
            {id: 5, location: 'Route 19', rival: 'Sannah', level: '49'},
            {id: 6, location: 'Route 19', rival: 'Tierno', level: '48'},
            {id: 7, location: 'Route 19', rival: 'Trovato', level: '48'},
            {
                id: 8,
                location: 'Siegesstraße',
                rival: {name: 'Kalem / Serena', key: 'kalem_serena', options: {male: 'kalem', female: 'serena'}},
                level: '59'
            },
        ],
        champion: {name: 'Diantha', sprite: '/champ-sprites/diantha.png'},
    },
    gen6_oras: {
        id: 'gen6_oras',
        name: 'Pokémon Omega Rubin / Alpha Saphir',
        badgeSet: 'gen3/rusasm',
        badge: {
            segments: [
                {text: 'ΩR', bgColor: '#bf0109', textColor: '#f8f688', borderColor: '#4f1734'},
                {text: 'αS', bgColor: '#3862ae', textColor: '#f8f688', borderColor: '#0a1535'},
            ],
        },
        selectionColors: {
            'Omega Rubin': { bgColor: '#cf0304', textColor: '#ffffff', borderColor: '#cf0304' },
            'Alpha Saphir': { bgColor: '#3c3696', textColor: '#ffffff', borderColor: '#3c3696' },
        },
        levelCaps: [
            {id: 1, arena: '1. Arena', level: '14'},
            {id: 2, arena: '2. Arena', level: '16'},
            {id: 3, arena: '3. Arena', level: '21'},
            {id: 4, arena: '4. Arena', level: '23'},
            {id: 5, arena: '5. Arena', level: '30'},
            {id: 6, arena: '6. Arena', level: '35'},
            {id: 7, arena: '7. Arena', level: '42'},
            {id: 8, arena: '8. Arena', level: '46'},
            {id: 9, arena: 'Top 4', level: '55'},
            {id: 10, arena: 'Champ', level: '59'},
        ],
        rivalCaps: [
            {
                id: 1,
                location: 'Route 110',
                rival: {name: 'Brix / Maike', key: 'brix_maike', options: {male: 'brix', female: 'maike'}},
                level: '20'
            },
            {id: 2, location: 'Malvenfroh City', rival: 'Heiko', level: '16'},
            {
                id: 3,
                location: 'Route 119',
                rival: {name: 'Brix / Maike', key: 'brix_maike', options: {male: 'brix', female: 'maike'}},
                level: '33'
            },
            {
                id: 4,
                location: 'Seegrasulb City',
                rival: {name: 'Brix / Maike', key: 'brix_maike', options: {male: 'brix', female: 'maike'}},
                level: '39'
            },
            {id: 5, location: 'Siegesstraße', rival: 'Heiko', level: '48'},
        ],
        champion: {name: 'Troy', sprite: '/champ-sprites/troy.png'},
    },
};