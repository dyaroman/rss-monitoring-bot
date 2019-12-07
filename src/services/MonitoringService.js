require('dotenv').config();
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

const RssService = require('./RssService');
const SearchResults = require('./SearchResults');
const searchResults = new SearchResults(bot, false);

class Monitoring {
    constructor(db) {
        this.db = db;
        this.timerInterval = 60 * 1000; //1 min
        this.timeToCheck = [14, 47]; // 7:00AM (kiev)

        this.init();
    }

    init() {
        setInterval(() => {
            const now = new Date();

            if (now.getHours() === this.timeToCheck[0] && now.getMinutes() === this.timeToCheck[1]) {
                this.getUsers().then((users) => {
                    users.forEach((user) => {
                        if (user.monitorings.length) {
                            this.runSearch(user);
                        }
                    });
                });
            }
        }, this.timerInterval);
    }

    getUsers() {
        return this.db
            .collection('users')
            .find({})
            .toArray();
    }

    runSearch(user) {
        new RssService(user.monitorings)
            .search()
            .then((queryResults) => searchResults.send(user._id, queryResults));
    }
}

module.exports = Monitoring;
