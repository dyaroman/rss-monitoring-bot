const Parser = require('rss-parser');
const parser = new Parser();

require('dotenv').config();
const mongo = require('mongodb').MongoClient;
let db;


class ParseService {
    constructor(userId) {
        this.userId = userId;
        this.init();
    }

    init() {
        mongo.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, client) => {
            if (err) {
                //todo send error to me in telegram
                console.log(err);
            }

            db = client.db('rss_monitoring_bot');
        });

        this.searchResult = [];
        this.sourcesArray = [
            'http://feed.rutracker.cc/atom/f/4.atom', // Мультфильмы
            'http://feed.rutracker.cc/atom/f/930.atom', // Иностранные мультфильмы (HD Video)
            'http://feed.rutracker.cc/atom/f/209.atom', // Иностранные мультфильмы
            'http://feed.rutracker.cc/atom/f/7.atom', // Зарубежное кино
            'http://feed.rutracker.cc/atom/f/33.atom', // Аниме
            'http://feed.rutracker.cc/atom/f/189.atom', // Зарубежные сериалы
            'http://feed.rutracker.cc/atom/f/2366.atom', // Зарубежные сериалы (HD Video)
            'http://feed.rutracker.cc/atom/f/2198.atom', // HD Video
        ];
    }

    async search() {
        const currentUser = await db.collection('users').find({_id: this.userId}).toArray();
        this.queriesArray = currentUser[0].monitorings;

        for (const query of this.queriesArray) {
            await this.readFeed(query);
        }

        return this.searchResult;
    }

    async readFeed(query) {
        const queryResult = {
            query,
            result: []
        };

        for (const source of this.sourcesArray) {
            const feed = await parser.parseURL(source);

            feed.items.forEach(item => {
                const itemTitle = item.title
                    .trim()
                    .toLowerCase();

                const queryArray = query
                    .trim()
                    .replace(/  +/gm, ' ')
                    .toLowerCase()
                    .split(' ');

                if (queryArray.every(query => itemTitle.includes(query))) {
                    queryResult.result.push({
                        title: item.title,
                        link: item.link
                    });
                }
            });
        }

        this.searchResult.push(queryResult);
    }
}


module.exports = ParseService;
