const Parser = require('rss-parser');
const parser = new Parser();


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
        for (const query of this.queriesArray) {
            await this.readFeed(query);
        }

        return this.searchResult;
    }

    async readFeed(query) {
        const queryResult = {
            query,
            results: []
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
                    queryResult.results.push({
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
