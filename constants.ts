import type {AppState, LevelCap, RivalCap} from './types';


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

export const DEFAULT_RIVAL_CAPS: RivalCap[] = [
    {id: 1, location: 'Gavina', rival: 'N', level: '7', done: false, revealed: false},
    {id: 2, location: 'Route 2', rival: 'Bell', level: '6', done: false, revealed: false},
    {id: 3, location: 'Orion City', rival: 'Cheren', level: '8', done: false, revealed: false},
    {id: 4, location: 'Route 3', rival: 'Cheren', level: '14', done: false, revealed: false},
    {id: 5, location: 'Septerna City', rival: 'N', level: '13', done: false, revealed: false},
    {id: 6, location: 'Route 4', rival: 'Bell', level: '18', done: false, revealed: false},
    {id: 7, location: 'Route 4', rival: 'Cheren', level: '20', done: false, revealed: false},
    {id: 8, location: 'Rayono City', rival: 'N', level: '22', done: false, revealed: false},
    {id: 9, location: 'Route 5', rival: 'Cheren', level: '24', done: false, revealed: false},
    {id: 10, location: 'Marea City', rival: 'Bell', level: '26', done: false, revealed: false},
    {id: 11, location: 'Elektrolithhöhle', rival: 'N', level: '28', done: false, revealed: false},
    {id: 12, location: 'Wendelberg', rival: 'Cheren', level: '33', done: false, revealed: false},
    {id: 13, location: 'Route 8', rival: 'Bell', level: '38', done: false, revealed: false},
    {id: 14, location: 'Route 10', rival: 'Cheren', level: '43', done: false, revealed: false},
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

export const DEFAULT_LVL_CAPS: LevelCap[] = [
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
    ];

export const INITIAL_STATE: AppState = {
    player1Name: 'Jan',
    player2Name: 'Felix',
    team: [],
    box: [],
    graveyard: [],
    rules: DEFAULT_RULES,
    levelCaps: DEFAULT_LVL_CAPS,
    rivalCaps: DEFAULT_RIVAL_CAPS,
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
};

export const createInitialState = (): AppState => JSON.parse(JSON.stringify(INITIAL_STATE)) as AppState;
