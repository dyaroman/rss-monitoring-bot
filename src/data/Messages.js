const Messages = {
    start: `
Привет, я RuTracker Rss Monitoring Bot!
Чтобы добавить твой первый мониторинг, пожалуйста пришли мне "/add" и следуй инструкции.
  `,

    noActiveMonitorings: '⭕️ Нет мониторингов',

    addNewMonitoringQuestion: 'Какой фильм или сериал хотите мониторить?',
    removeMonitoringQuestion: 'Чтобы удалить мониторинг, пожалуйста пришлите его номер или полный запрос:',
    confirmRemoveAllMonitorings: 'Вы точно хотите удалить все мониторинги? \nЭто действие невозможно отменить!',
    confirmRemoveAllMonitoringButton: '🗑 Да, удалить все',

    allMonitoringsRemoved: '✅ Все мониторинги удалены!',
    allMonitoringsAmountTitle: '<b>У вас {{amount}} мониторинг:</b>\n\n',
    searchResultTitle: '🎯 Мне удалось найти {{amount}} результа по запросу "<b>{{query}}</b>":\n\n',

    addedNewMonitoring: '✅ "{{query}}" мониторинг добавлен!',
    existedMonitoring: '❌ "{{query}}" такой мониторинг уже существует!',
    removedMonitoring: '✅ "{{query}}" мониторинг удален!',
    monitoringNotFound: '❌ "{{query}}" мониторинг не найден!',
};

module.exports = Messages;
