const Parser = require('rss-parser');
const parser = new Parser();


class ParseService {
    constructor(userId, db) {
        this.userId = userId;
        this.db = db;

        this.init();
    }

    init() {
        this.searchResults = [];
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

    search() {
        return this.db.collection('users').findOne({ _id: this.userId }).then(async user => {
            for (const query of user.monitorings) {
                this.searchResults.push({
                    query,
                    results: await this.readFeed(query)
                });
                
            }

            return this.searchResults;
        });
    }

    async readFeed(query) {
        const arr = [];
        for (const source of this.sourcesArray) {
            await parser.parseURL(source).then(feed => {
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
                        arr.push({
                            title: item.title,
                            link: item.link
                        });
                    }
                });
            });
        }
        return arr;
    }
}


module.exports = ParseService;
