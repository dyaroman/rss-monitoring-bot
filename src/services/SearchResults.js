const messages = require('../data/Messages');

class SearchResults {
    constructor(bot, sendEmpty) {
        this.bot = bot;
        this.sendEmpty = sendEmpty;
    }

    send(userID, resultsArray) {
        const messagesArray = [];

        resultsArray.forEach((result) => {
            let message = '';

            if (result.results.length === 0) {
                message += messages.noSearchResult.replace('{{query}}', result.query);
            } else {
                message += messages.searchResultTitle
                    .replace('{{amount}}', result.results.length)
                    .replace('{{query}}', result.query);

                result.results.forEach((item, i) => {
                    if (message.length <= 4096) {
                        message += `${++i}. <a href="${item.link}">${item.title}</a>\n\n`;
                    } else {
                        messagesArray.push(message);
                        message = '';
                    }
                });
            }

            messagesArray.push(message);
        });

        this.sendEmpty && messagesArray.forEach(async (message) => {
            await this.bot.telegram.sendMessage(userID, message, {
                disable_web_page_preview: true,
                disable_notification: true,
                parse_mode: 'html',
            });
        });
    }
}


module.exports = SearchResults;
