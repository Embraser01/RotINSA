var bus = new Vue();

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
            started: false,
            info: {},
            cards: []
        }
    },
    methods: {
        init: function (info, cards) {
            this.info = info;
            this.cards = cards;
            this.started = true;
            console.log('Init w/', info);
        },
        next: function () {
            console.log('Loading next question ', this.cards);
        },
        close: function () {
            this.started = false;
        }
    },
    created: function () {
        bus.$on('deck-loaded', this.init);
    }
});


var vm = new Vue({

    el: '#app',

    data: {
        app: null,
        decks: null
    },

    created: function () {
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

                self.decks = self.app.decks;
                console.log(self.decks);
            };
            xhr.send()
        }
    }
});