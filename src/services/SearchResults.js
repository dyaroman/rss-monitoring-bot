const messages = require('../data/Messages');

class SearchResults {
    constructor(bot) {
        this.bot = bot;
    }

    send(userID, resultsArray) {
        const messagesArray = [];

        for (let i = 0; i < resultsArray.length; i++) {
            let message = '';

            if (resultsArray[i].results.length === 0) {
                continue;
            } else {
                message += messages.searchResultTitle
                    .replace('{{amount}}', resultsArray[i].results.length)
                    .replace('{{query}}', resultsArray[i].query);

                resultsArray[i].results.forEach((item, i) => {
                    if (message.length <= 4096) {
                        message += `${++i}. <a href="${item.link}">${item.title}</a>\n\n`;
                    } else {
                        messagesArray.push(message);
                        message = '';
                    }
                });
            }

            messagesArray.push(message);
        }

        messagesArray.forEach(async (message) => {
            await this.bot.telegram.sendMessage(userID, message, {
                disable_web_page_preview: true,
                disable_notification: true,
                parse_mode: 'html',
            });
        });
    }
}


module.exports = SearchResults;
