import type {AppState} from './types';
import { GAME_VERSIONS } from '@/src/data/game-versions';


export const PLAYER1_COLOR = '#cf5930';
export const PLAYER2_COLOR = '#693992';

export const DEFAULT_RULES: string[] = [
    'Pro Route/Gebiet darf nur das erste Pokémon gefangen werden. Diese Pokémon ist mit dem Pokémon des Partners verbunden.',
    'Pokémon, die bereits gefangen/encountered wurden (oder deren Evolutionsreihe) zählen nicht als Routen Pokémon und dürfen gererolled werden. Es gibt max. 2 weitere Versuche.',
    'Geschenkte/Statische Pokémon & Fossile gelten nicht als Gebietspokémon und dürfen verwendet werden (auch wenn bereits gefangen, auch mit Partner verbunden). Wiederkehrende Statics dürfen nur einmal gefangen werden.',
    'Wenn ein Pokémon beim Fangversuch flieht/stirbt, zählt das Gebiet als verloren. Der Seelenpartner muss freigelassen werden.',
    'Jedes Pokémon erhält einen Spitznamen, den der Seelenpartner auswählt.',
    'Besiegte Pokémon gelten als verstorben und müssen so wie ihr Seelenpartner in eine Grab-Box. (Wenn bereits im Kampf, Verwendung bis zum Ende)',
    'Pokémon, Items, und Trainer sind gerandomized.',
    'Der Bonusshop ist gerandomized, jedes Item darf max. 1 mal gekauft werden.',
    'Das Level-Cap darf nicht überschritten werden (1 Pokémon auf höherem Level, restliche auf niedrigerem). Überlevelte Pokémon sowie ihr Seelenpartner dürfen nicht verwendet werden, bis der Level-Cap wieder ansteigt.',
    'Sonderbonbons dürfen direkt VOR Arenaleiter/Top-4/Champion/Rivalen verwendet werden. Sie dürfen außerdem verwendet werden um Pokémon auf das Level-Cap der letzten Arena zu bringen.',
    "Kampffolge wird auf 'Folgen' gestellt.",
    'Gegenstände im Kampf nur, wenn der Gegner auch einen verwendet. In der Top 4 max. 20 Items außerhalb von Kämpfen',
    'Shiny Pokémon dürfen immer gefangen und nach belieben ausgetauscht werden.',
    'Challenge verloren, wenn das komplette Team eines Spielers besiegt wurde.',
    'Challenge geschafft, wenn der Champ der Region besiegt wurde.',
    'Challenge startet sobald man die ersten Pokébälle erhalten hat.',
    'Kein Googlen während Arena/Top-4/Rivalen/Boss-Kämpfen',
    'Max. 2 legendäre Pokémon pro Team',
];

export const LEGENDARY_POKEMON_NAMES: string[] = [
    'Arktos', 'Zapdos', 'Lavados', 'Mewtu', 'Mew',
    'Raikou', 'Entei', 'Suicune', 'Lugia', 'Ho-Oh', 'Celebi',
    'Regirock', 'Regice', 'Registeel', 'Latias', 'Latios', 'Kyogre', 'Groudon', 'Rayquaza', 'Jirachi', 'Deoxys',
    'Selfe', 'Vesprit', 'Tobutz', 'Dialga', 'Palkia', 'Heatran', 'Regigigas', 'Giratina', 'Cresselia',
    'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus',
    'Victini', 'Kobalium', 'Terrakium', 'Viridium', 'Boreos', 'Voltolos', 'Reshiram', 'Zekrom', 'Demeteros', 'Kyurem', 'Keldeo', 'Meloetta', 'Genesect',
    'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa', 'Volcanion'
];

const DEFAULT_GAME_VERSION_ID = 'gen5_sw';

export const INITIAL_STATE: AppState = {
    player1Name: 'Jan',
    player2Name: 'Felix',
    team: [],
    box: [],
    graveyard: [],
    rules: DEFAULT_RULES,
    levelCaps: [],
    rivalCaps: [],
    stats: {
        runs: 1,
        best: 0,
        top4Items: {
            player1: 0,
            player2: 0,
        },
        deaths: {
            player1: 0,
            player2: 0,
        },
        sumDeaths: {
            player1: 0,
            player2: 0,
        },
        legendaryEncounters: 0,
    },
    legendaryTrackerEnabled: true,
    rivalCensorEnabled: true,
    runStartedAt: Date.now(),
};

export const createInitialState = (gameVersionId: string = DEFAULT_GAME_VERSION_ID): AppState => {
    const gameVersion = GAME_VERSIONS[gameVersionId] || GAME_VERSIONS[DEFAULT_GAME_VERSION_ID];
    const base = JSON.parse(JSON.stringify(INITIAL_STATE)) as AppState;

    base.levelCaps = gameVersion.levelCaps.map(cap => ({...cap, done: false}));
    base.rivalCaps = gameVersion.rivalCaps.map(cap => ({...cap, done: false, revealed: false}));
    base.runStartedAt = Date.now();
    return base;
};
