//
//  CONSTANTES
//

var DEFAULT_NB_PLAYER = 3;



//
// UTILS
//

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

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

//
// GLOBAL VARIABLES AND INIT
//

Vue.config.devtools = true;

// Include Vue material
Vue.use(VueMaterial);

// Event bus for unrelated components
var bus = new Vue();


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
        }
    },
    methods: {
        loadDeck: function () {
            console.log('Loading deck ', this.deck);

            var xhr = new XMLHttpRequest();
            var self = this;

            xhr.open('GET', this.deck.questions_url);
            xhr.onload = function () {
                var data = JSON.parse(xhr.responseText);

                // TODO Mettre en cache les questions

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
            currentCard: {},
            currentPlayer: {},
            info: {},
            cards: [],
            usedCards: [],
            players: []
        }
    },
    computed: {
        cardReader: function () {
            if (!this.currentCard) return;

            var content = this.currentCard.content;
            var list;

            console.log('humanize', this.currentCard);

            // DEPRECATED {b}
            content = content.replace(/{b}/g, String.fromCharCode(0xf0fc));

            // {b1-3}
            list = content.match(/{b\d+-\d+}/g);

            if (list) {
                content = content.replace(
                    /{b\d+-\d+}/g,
                    function (value) {
                        // Each string is different
                        var data = /{b(\d+)-(\d+)}/g.exec(value);

                        return repeat(String.fromCharCode(0xf0fc), Number(data[2]) - Number(data[1]));
                    }
                );
            }

            // {j1}
            if (this.currentPlayer) content = content.replace(/{j1}/g, this.currentPlayer.name);

            // {j2} & {j3}
            var j2 = this.players[Math.floor(Math.random() * this.players.length)];
            var j3 = this.players[Math.floor(Math.random() * this.players.length)];


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

            // {b1-3}
            list = content.match(/{((\w|\s)+)(\|(\w|\s)+)+}/g);

            if (list) {
                content = content.replace(
                    /{((\w|\s)+)(\|(\w|\s)+)+}/g,
                    function (value) {
                        // Each string is different
                        var data = value.slice(1, -1).split('|');
                        return data[Math.floor(Math.random() * data.length)];
                    }
                );
            }


            return content;
        }
    },
    methods: {
        init: function (info, cards) {
            this.info = info;
            this.cards = cards;
            this.status = 1; // Ready to load players

            console.log('Init w/', this);
        },
        validatePlayers: function (players) {
            this.players = players;
            console.log('Players for this party are : ', players);

            this.ready();
        },
        ready: function () {
            // Showing rules
            this.status = 2;

            this.cards = shuffle(this.cards);
            this.usedCards = [];
            this.currentCard = {};
            this.currentPlayer = {};
        },
        closeRules: function () {
            // We start or restart playing
            this.status = 3;
        },
        next: function () {
            console.log('Players : ', this.players);
            if (this.cards.length !== this.usedCards.length) {
                // Loading next card and next player

                this.currentCard.skipTurn = this.currentCard.skipTurn || 1;


                switch (this.currentCard.skipTurn) {
                    case 0:
                        // Same player
                        break;
                    case 2:
                        // Skip one player
                        this.currentPlayer = this.players[(this.players.indexOf(this.players) + 2) % this.players.length];
                        break;
                    case 1:
                    default:
                        this.currentPlayer = this.players[(this.players.indexOf(this.players) + 1) % this.players.length];
                        break;
                }

                do {
                    this.currentCard = this.cards[Math.floor(Math.random() * this.cards.length)];
                    // While it's an used card
                } while (this.usedCards.indexOf(this.currentCard) !== -1);

                // COUNT
                this.currentCard.currentCount = this.currentCard.currentCount || this.currentCard.count || 0;

                if (this.currentCard.currentCount > 0) {
                    // If the card can be selected more than one time
                    this.currentCard.currentCount--;
                } else {
                    // Otherwise we add this card in usedCards
                    this.usedCards.push(this.currentCard)
                }

            } else {
                // END Of the game
                this.status = 4;
            }
        },
        end: function (restart) {
            if (restart) {
                this.ready();
            } else {
                bus.$emit('deck-finished');
            }
        }
    },
    created: function () {
        console.log('Deck created');
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
        for (var i = 0; i < DEFAULT_NB_PLAYER; i++) this.addPlayer();
    }
});


//
// MAIN VIEW
//


var vm = new Vue({

    el: '#app',

    data: {
        app: null,
        hide: false,
        decks: null
    },

    created: function () {
        // We subscribe for when the deck is closed or loaded
        var self = this;
        bus.$on('deck-finished', function () {
            self.hide = false;
        });
        bus.$on('deck-loaded', function () {
            self.hide = true;
        });

        // Chargement de la liste des decks
        this.fetchData();


    },

    methods: {
        fetchData: function () {
            var xhr = new XMLHttpRequest();
            var self = this;

            xhr.open('GET', './manifest.json');
            xhr.onload = function () {
                self.app = JSON.parse(xhr.responseText);

                // We add some random here because why not
                self.app.decks = shuffle(self.app.decks);
                self.decks = self.app.decks;
                console.log(self.decks);
            };
            xhr.send()
        }
    }
});