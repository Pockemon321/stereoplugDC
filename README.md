Изменения в API Discord:

Код плагина опирается на внутренние модули Discord, такие как WebpackModules.getModule с фильтром byPrototypeFields("updateVideoQuality") и WebpackModules.getByProps("hasVideo", "disconnect", "isConnected"). Эти модули могли измениться в структуре или названиях свойств из-за обновлений Discord, что ломает логику поиска через Webpack.

Свойства, такие как conn.setTransportOptions, могли быть переименованы или перенесены в другой объект.
Обновления Better Discord:

Плагин использует ZeresPluginLibrary, и его версия или API могли измениться. Например, методы вроде Patcher.after или BdApi.UI.showNotice могли обновиться, требуя адаптации к новым сигнатурам.
Spotify Pause Blocker:

Функция блокировки паузы Spotify перехватывает запросы к https://api.spotify.com/v1/me/player/pause, заменяя их на play. Это могло перестать работать из-за изменений в API Spotify или из-за того, что Discord теперь использует другой механизм взаимодействия со Spotify (например, WebSocket вместо HTTP-запросов).
Аудиокодеки и настройки:

Discord мог изменить способ обработки аудио (например, перейти на новый кодек или ограничить доступ к параметрам вроде stereo и encodingVoiceBitRate), что делает патч setTransportOptions неэффективным.
Совместимость с текущими версиями:

Последняя версия плагина (0.0.6) указывает совместимость с Better Discord v1.11.0, но за это время могли выйти новые версии как Better Discord, так и Discord, что требует обновления кода.
