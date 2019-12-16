const Messages = {
    start: `
Hello there, I am RuTracker Rss Monitoring Bot!
Let's start, please send me "/add" to add your first monitoring.
  `,

    noActiveMonitorings: '⭕️ No active monitoring!',

    addNewMonitoringQuestion: 'What movie or TV show do want to monitoring?',
    removeMonitoringQuestion: 'To remove monitoring please send me list number or its full name:',
    confirmRemoveAllMonitorings: 'Do you want to remove all monitoring? \nIt can\'t be undone!',
    confirmRemoveAllMonitoringButton: '🗑 Yes, remove all',

    allMonitoringsRemoved: '✅ All monitoring removed!',
    allMonitoringsAmountTitle: '<b>Your have {{amount}} active monitoring:</b>\n\n',
    searchResultTitle: '🎯 I found {{amount}} results for your request "<b>{{query}}</b>":\n\n',

    addedNewMonitoring: '✅ "{{query}}" monitoring added!',
    existedMonitoring: '❌ "{{query}}" monitoring already added!',
    removedMonitoring: '✅ "{{query}}" monitoring removed!',
    monitoringNotFound: '❌ "{{query}}" monitoring not found!',
};

module.exports = Messages;
