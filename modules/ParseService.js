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
        this.result = [];
        this.sourcesArray = [
            'http://feed.rutracker.cc/atom/f/4.atom', // Мультфильмы
            'http://feed.rutracker.cc/atom/f/7.atom', // Зарубежные сериалы
            'http://feed.rutracker.cc/atom/f/33.atom', // Аниме
            'http://feed.rutracker.cc/atom/f/189.atom', // Зарубежное кино
            'http://feed.rutracker.cc/atom/f/2366.atom', // Зарубежные сериалы (HD Video)
        ];
    }
    
    async search() {
        this.queriesArray = usersJsonService.readJsonFile(this.userId).monitorings;
        
        for (const source of this.sourcesArray) {
            await this.readFeed(source);
        }

        return this.result;
    }

    async readFeed(source) {
        const feed = await parser.parseURL(source);

        this.queriesArray.forEach(query => {
            feed.items.forEach(item => {
                if (item.title.toLowerCase().includes(query.toLowerCase())) {
                    const obj = {
                        title: item.title,
                        link: item.link
                    };
                    this.result.push(obj);
                }
            });
        });
    }
};


module.exports = ParseService;