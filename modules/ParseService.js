const Parser = require('rss-parser');
const parser = new Parser();

const JsonService = require('./JsonService');
const usersJsonService = new JsonService('users');


class ParseService {
    constructor(userId) {
        this.userId = userId;
        this.init();
    }

    init() {
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
        this.queriesArray = usersJsonService.readJsonFile(this.userId).monitorings;

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
                if (item.title.toLowerCase().includes(query.toLowerCase())) {
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
