//
//  CONSTANTES
//

const DEFAULT_NB_PLAYER = 3;
const BEER_ENTITY = '&#x1f37a;';
const DEBUG_MODE = true;
const ALERT_MSG = "Revenir à l'acceuil ?";

//
// UTILS
//

function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function repeat(value, num) {
    return new Array(num + 1).join(value);
}

function generateUUID() { // Public Domain/MIT
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function log() {
    if (!DEBUG_MODE) return;
    return console.log(arguments);
}

//
// GLOBAL VARIABLES AND INIT
//

Vue.config.devtools = DEBUG_MODE;

// Include Vue material
Vue.use(VueMaterial);


// Event bus for unrelated components
const bus = new Vue();


//
// COMPONENTS
//

Vue.component('card', {
    template: '#card-component',
    props: ['deck'],
    data: function () {
        return {
            info: {},
            cards: null
        };
    },
    methods: {
        loadDeck: function () {
            log('Loading deck ', this.deck);

            let xhr = new XMLHttpRequest();
            xhr.open('GET', this.deck.questions_url);
            xhr.onload = () => {
                let data = JSON.parse(xhr.responseText);
                bus.$emit('deck-loaded', data.info, data.cards);
            };
            xhr.send()
        }
    }
});

Vue.component('deck', {
    template: '#deck-component',
    data: function () {
        return {
            status: 0, // 0 Not started | 1 Players loading | 2 Rules | 3 Playing
            currentCard: null,
            currentPlayer: null,
            info: {},
            cards: [],
            notUsedCards: [],
            players: []
        };
    },
    computed: {
        cardReader: function () {
            if (!this.currentCard) return;

            let content = this.currentCard.content;

            log('humanize', this.currentCard);

            // DEPRECATED {b}
            content = content.replace(/{b}/g, BEER_ENTITY);

            // {b1-3}
            content = content.replace(/{b\d+-\d+}/g, value => {
                // Each string is different
                const data = /{b(\d+)-(\d+)}/g.exec(value);
                return repeat(BEER_ENTITY, Number(data[2]) - Number(data[1]));
            });

            // {j1}
            if (this.currentPlayer) content = content.replace(/{j1}/g, this.currentPlayer.name);

            // {j2} & {j3}
            let j2 = this.players[Math.floor(Math.random() * this.players.length)];
            let j3 = this.players[Math.floor(Math.random() * this.players.length)];


            if (j2 === this.currentPlayer) {
                j2 = this.players[(this.players.indexOf(j2) + 1) % this.players.length];
            }

            if (j3 === this.currentPlayer) {
                j3 = this.players[(this.players.indexOf(j3) + 1) % this.players.length];
            }

            if (j3 === j2) {
                j3 = this.players[(this.players.indexOf(j2) + 1) % this.players.length];
            }

            content = content.replace(/{j2}/g, j2.name);
            content = content.replace(/{j3}/g, j3.name);

            // {one|two|three}
            content = content.replace(/{.+(\|.+)+}/g, value => {
                // Each string is different
                const data = value.slice(1, -1).split('|');
                return data[Math.floor(Math.random() * data.length)];
            });

            return content;
        }
    },
    methods: {
        init: function (info, cards) {
            this.info = info;
            this.cards = cards;
            this.status = 1; // Ready to load players

            log('Init w/', this);
        },
        validatePlayers: function (players) {
            this.players = players;
            log('Players for this party are : ', players);

            this.ready();
        },
        ready: function () {
            // Showing rules
            this.status = 2;

            this.notUsedCards = shuffle(this.cards.slice(0));
            this.currentCard = null;
            this.currentPlayer = null;
        },
        closeRules: function () {
            // We start or restart playing
            this.status = 3;
            this.next();
        },
        next: function () {
            if (this.notUsedCards.length > 0) {
                // Loading next card and next player

                // For the first card we need to have an object
                if (this.currentCard === null) this.currentCard = {};

                this.currentCard.skipTurn = this.currentCard.skipTurn || 1;


                switch (this.currentCard.skipTurn) {
                    case 0:
                        // Same player
                        break;
                    case 2:
                        // Skip one player
                        this.currentPlayer = this.players[(this.players.indexOf(this.currentPlayer) + 2) % this.players.length];
                        break;
                    case 1:
                    default:
                        this.currentPlayer = this.players[(this.players.indexOf(this.currentPlayer) + 1) % this.players.length];
                        break;
                }

                this.currentCard = this.notUsedCards[Math.floor(Math.random() * this.notUsedCards.length)];

                // COUNT
                this.currentCard.currentCount = this.currentCard.currentCount || this.currentCard.count || 0;

                if (this.currentCard.currentCount > 0) {
                    // If the card can be selected more than one time
                    this.currentCard.currentCount--;
                } else {
                    // Otherwise we remove this card from notUsedCard
                    this.notUsedCards.splice(this.notUsedCards.indexOf(this.currentCard), 1);
                }
            } else {
                // END Of the game
                this.status = 4;
            }
        },
        end: function (restart) {
            if (restart) {
                this.ready();
            } else if (confirm(ALERT_MSG)) {
                this.status = 0;
                bus.$emit('deck-finished');
            }
        }
    },
    created: function () {
        log('Deck created');
        bus.$on('deck-loaded', this.init);
    }
});

Vue.component('players', {
    template: '#players-component',
    data: function () {
        return {
            players: []
        }
    },
    methods: {
        addPlayer: function () {
            this.players.push({
                name: ""
            });
        },
        validate: function () {
            this.$emit('validate', this.players);
        }
    },
    created: function () {
        for (let i = 0; i < DEFAULT_NB_PLAYER; i++) this.addPlayer();
    }
});


//
// MAIN VIEW
//


const vm = new Vue({

    el: '#app',

    data: {
        app: null,
        hide: false,
        decks: null
    },

    created: function () {
        // We subscribe for when the deck is closed or loaded
        bus.$on('deck-finished', () => {
            this.hide = false;
        });
        bus.$on('deck-loaded', () => {
            this.hide = true;
        });

        // Chargement de la liste des decks
        this.fetchData();


    },

    methods: {
        fetchData: function () {
            const xhr = new XMLHttpRequest();

            xhr.open('GET', './manifest.json');
            xhr.onload = () => {
                this.app = JSON.parse(xhr.responseText);

                // We add some random here because why not
                this.app.decks = shuffle(this.app.decks);
                this.decks = this.app.decks;
                log(this.decks);
            };
            xhr.send()
        }
    }
});


//
// SERVICES
//

class Player {
    constructor(name) {
        this._name = name;
        this.id = generateUUID();
    }

    set name(name) {
        this._name = name;
    }

    get name() {
        return this._name;
    }
}

class PlayersService {

    constructor() {
        this._players = JSON.parse(localStorage.getItem('players')) || [];
    }

    get players() {
        return this._players.slice(0); // Clone array
    }

    addPlayer(player) {
        if (!player instanceof Player) throw new Error(`Excepted Player but got ${typeof player}`);
        this._players.push(player);
        this._save();
    }

    deletePlayer(player) {
        if (!player instanceof Player) throw new Error(`Excepted Player but got ${typeof player}`);
        this._players = this._players.filter(p => p.id !== player.id);
        this._save();
    }

    updatePlayer(player) {
        if (!player instanceof Player) throw new Error(`Excepted Player but got ${typeof player}`);
        const toUpdate = this._players.find(p => p.id !== player.id);

        if (toUpdate && toUpdate !== player) toUpdate.name = player.name;
        this._save();
    }

    _save() {
        localStorage.setItem('players', JSON.stringify(this._players));
    }
}

let playersService = new PlayersService();