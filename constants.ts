import type {AppState} from './types';


export const PLAYER1_COLOR = '#cf5930';
export const PLAYER2_COLOR = '#693992';

export const DEFAULT_RULES: string[] = [
    'Pro Route/Gebiet darf nur das erste Pokémon gefangen werden. Diese Pokémon ist mit dem Pokémon des Partners verbunden.',
    'Pokémon, die bereits gefangen/encountered wurden (oder deren Evolutionsreihe) zählen nicht als Routen Pokémon und dürfen gererolled werden. Es gibt max. 2 weitere Versuche.',
    'Geschenkte/Statische Pokémon & Fossile gelten nicht als Gebietspokémon und dürfen verwendet werden (auch wenn bereits gefangen, auch mit Partner verbunden).',
    'Wenn ein Pokémon beim Fangversuch flieht/stirbt, zählt das Gebiet als verloren. Der Seelenpartner muss freigelassen werden.',
    'Jedes Pokémon erhält einen Spitznamen, den der Seelenpartner auswählt.',
    'Besiegte Pokémon gelten als verstorben und müssen so wie ihr Seelenpartner in eine Grab-Box. (Wenn bereits im Kampf, Verwendung bis zum Ende)',
    'Pokémon, Items, und Trainer sind gerandomized.',
    'Der Bonusshop ist gerandomized, jedes Item darf max. 1 mal gekauft werden.',
    'Das Level-Cap darf nicht überschritten werden (1 Pokémon auf höherem Level, restliche auf niedrigerem). Überlevelte Pokémon sowie ihr Seelenpartner dürfen nicht verwendet werden, bis der Level-Cap wieder ansteigt.',
    'Sonderbonbons dürfen direkt VOR Arenaleiter/Top-4/Champion verwendet werden. Sie dürfen außerdem verwendet werden um Pokémon auf das Level-Cap der letzten Arena zu bringen.',
    "Kampffolge wird auf 'Folgen' gestellt.",
    'Gegenstände im Kampf nur, wenn der Gegner auch einen verwendet. In der Top 4 max. 20 Items außerhalb von Kämpfen',
    'Shiny Pokémon dürfen immer gefangen und nach belieben ausgetauscht werden.',
    'Challenge verloren, wenn das komplette Team eines Spielers besiegt wurde.',
    'Challenge geschafft, wenn der Champ der Region besiegt wurde.',
    'Challenge startet sobald man die ersten Pokébälle erhalten hat.',
    'Kein Googlen während Arena/Top-4/Rivale/Boss-Kämpfen',
    'Max. 2 legendäre Pokémon pro Team',
];

export const INITIAL_STATE: AppState = {
    player1Name: 'Jan',
    player2Name: 'Felix',
    team: [],
    box: [],
    graveyard: [],
    rules: DEFAULT_RULES,
    levelCaps: [
        {id: 1, arena: '1. Arena', level: '14/12', done: false},
        {id: 2, arena: '2. Arena', level: '20/18', done: false},
        {id: 3, arena: '3. Arena', level: '23/21', done: false},
        {id: 4, arena: '4. Arena', level: '27/25', done: false},
        {id: 5, arena: '5. Arena', level: '31/29', done: false},
        {id: 6, arena: '6. Arena', level: '35/33', done: false},
        {id: 7, arena: '7. Arena', level: '39/37', done: false},
        {id: 8, arena: '8. Arena', level: '43/31', done: false},
        {id: 9, arena: 'Top 4', level: '50/48', done: false},
        {id: 10, arena: 'Champ', level: '52/50', done: false},
    ],
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
    },
};
