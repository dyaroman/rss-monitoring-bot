const Messages = {
    start: `
Hello there, I am RuTracker Rss Monitoring Bot!
Let's start, please send me "/controls" or choose it in commands.
  `,

    controlsButtons: 'Choose command below:',
    addNewMonitoringButton: '➕ Add new monitoring',
    removeMonitoringButton: '➖ Remove monitoring',
    removeAllMonitoringsButton: '🗑 Remove all monitoring',
    showMonitoringsButton: '📺 Show active monitoring',
    runSearchButton: '🔍 Run search',

    noSearchResult: '❎ There are no results for your request "<b>{{query}}</b>".',
    noActiveMonitorings: '❎ No active monitoring!',

    addNewMonitoringQuestion: 'What movie or TV show do want to monitoring?',
    removeMonitoringQuestion: 'To remove monitoring please send me list number or its full name:',
    confirmRemoveAllMonitorings: 'Do you want to remove all monitoring? \nIt can\'t be undone!',

    allMonitoringsRemoved: '✅ All monitoring removed!',
    allMonitoringsAmountTitle: '<b>Your have {{amount}} active monitoring:</b>\n\n',
    searchResultTitle: '🎯 I found {{amount}} results for your request "<b>{{query}}</b>":\n\n',
    searchBegin: 'Search in progress, please wait.',

    addedNewMonitoring: '✅ "{{query}}" monitoring added!',
    existedMonitoring: '❎ "{{query}}" monitoring already added!',
    removedMonitoring: '✅ "{{query}}" monitoring removed!',
    monitoringNotFound: '❎ "{{query}}" monitoring not found!',
};

module.exports = Messages;
