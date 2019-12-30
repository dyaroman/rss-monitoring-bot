export const messages = {
    start: `
Привет, я RuTracker Rss Monitoring Bot!
Чтобы добавить твой первый мониторинг, пожалуйста пришли мне "/add" и следуй инструкции.
  `,

    noActiveMonitorings: '⭕️ Нет мониторингов',

    addNewMonitoringQuestion: 'Какой фильм или сериал хотите мониторить?',
    removeMonitoringQuestion: 'Чтобы удалить мониторинг, пожалуйста пришлите его номер или полный запрос:',
    confirmRemoveAllMonitorings: 'Удалить все мониторинги? \nЭто действие необратимо!',
    confirmRemoveAllMonitoringButton: '🗑 Да, удалить все',

    allMonitoringsRemoved: '✅ Все мониторинги удалены!',
    allMonitoringsAmountTitle: '<b>Ваш список мониторингов:</b>\n\n',
    searchResultTitle: '🎯 Мониторинг "<b>{{query}}</b>" дал следующие результаты:\n\n',

    addedNewMonitoring: '✅ "{{query}}" мониторинг добавлен!',
    existedMonitoring: '❌ "{{query}}" такой мониторинг уже существует!',
    removedMonitoring: '✅ "{{query}}" мониторинг удален!',
    monitoringNotFound: '❌ "{{query}}" мониторинг не найден!',

    errorNotification: `Ошибка у пользователя: {{userId}}. \nТекст ошибки:\n{{errorMessage}}`,
};
