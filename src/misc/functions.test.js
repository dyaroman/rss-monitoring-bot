const { searchInData } = require("./functions");

describe('"searchInData" function should return:', () => {
    test('"false" for "Тихое место 2" in "Тихое место / A Quiet Place (Джон Красински / John Krasinski) [2018, США, ужасы, фантастика, драма, HDTV 1080i] [Локализованный видеоряд] Dub (Пифагор) + Sub Rus [4.09 GB] (https://rutracker.org/forum/viewtopic.php?t=6015919)"', () => {
        expect(
            searchInData(
                "Тихое место 2",
                "Тихое место / A Quiet Place (Джон Красински / John Krasinski) [2018, США, ужасы, фантастика, драма, HDTV 1080i] [Локализованный видеоряд] Dub (Пифагор) + Sub Rus [4.09 GB] (https://rutracker.org/forum/viewtopic.php?t=6015919)"
            )
        ).toBeFalsy();
    });

    test('"false" for "The show" in "[Обновлено] Стража / The Watch / Сезон: 1 / Серии: 1-8 из 8 (Эмма Салливан) [2021, Великобритания, фэнтези, боевик, триллер, драма, приключения, WEB-DL 720p] MVO (LostFilm, NewStudio, TVShows) + Dub (Novamedia) + DVO (Кубик в Кубе) + Original + Sub (Rus, Eng) [14.97 GB] (https://rutracker.org/forum/viewtopic.php?t=5992406)"', () => {
        expect(
            searchInData(
                "The show",
                "[Обновлено] Стража / The Watch / Сезон: 1 / Серии: 1-8 из 8 (Эмма Салливан) [2021, Великобритания, фэнтези, боевик, триллер, драма, приключения, WEB-DL 720p] MVO (LostFilm, NewStudio, TVShows) + Dub (Novamedia) + DVO (Кубик в Кубе) + Original + Sub (Rus, Eng) [14.97 GB] (https://rutracker.org/forum/viewtopic.php?t=5992406)"
            )
        ).toBeFalsy();
    });

    test('"false" for "The show" in "Стража / The Watch / Сезон: 1 / Серии: 1-8 из 8 (Эмма Салливан) [2021, Великобритания, фэнтези, боевик, триллер, драма, приключения, WEB-DL 720p] MVO (LostFilm, NewStudio, TVShows) + Dub (Novamedia) + DVO (Кубик в Кубе) + Original + Sub (Rus, Eng) [14.97 GB] (https://rutracker.org/forum/viewtopic.php?t=5992406)"', () => {
        expect(
            searchInData(
                "The show",
                "Стража / The Watch / Сезон: 1 / Серии: 1-8 из 8 (Эмма Салливан) [2021, Великобритания, фэнтези, боевик, триллер, драма, приключения, WEB-DL 720p] MVO (LostFilm, NewStudio, TVShows) + Dub (Novamedia) + DVO (Кубик в Кубе) + Original + Sub (Rus, Eng) [14.97 GB] (https://rutracker.org/forum/viewtopic.php?t=5992406)"
            )
        ).toBeFalsy();
    });

    // test('"false" for "" in ""', () => {
    //     expect(searchInData("", "")).toBeFalsy();
    // });

    // test('"true" for "" in ""', () => {
    //     expect(searchInData("", "")).toBeTruthy();
    // });

    test('"true" for "The Banker" in "Банкир / The Banker (Джордж Нолфи / George Nolfi) [2020, США, драма, биография, WEB-DL 2160p Dolby Vision] MVO + VO + Original (Eng) + Sub (Rus, Eng) [21.82 GB] (https://rutracker.org/forum/viewtopic.php?t=6014896)"', () => {
        expect(
            searchInData(
                "The Banker",
                "Банкир / The Banker (Джордж Нолфи / George Nolfi) [2020, США, драма, биография, WEB-DL 2160p Dolby Vision] MVO + VO + Original (Eng) + Sub (Rus, Eng) [21.82 GB] (https://rutracker.org/forum/viewtopic.php?t=6014896)"
            )
        ).toBeTruthy();
    });

    test('"true" for "Enola Holmes" in "Энола Холмс / Enola Holmes (Гарри Брэдбир / Harry Bradbeer) [2020, Великобритания, драма, криминал, детектив, WEB-DL 1080p HDR] Dub + 3x MVO + Original (Eng) + Sub (Rus, Eng) [5.97 GB] (https://rutracker.org/forum/viewtopic.php?t=5975892)"', () => {
        expect(
            searchInData(
                "Enola Holmes",
                "Энола Холмс / Enola Holmes (Гарри Брэдбир / Harry Bradbeer) [2020, Великобритания, драма, криминал, детектив, WEB-DL 1080p HDR] Dub + 3x MVO + Original (Eng) + Sub (Rus, Eng) [5.97 GB] (https://rutracker.org/forum/viewtopic.php?t=5975892)"
            )
        ).toBeTruthy();
    });

    test('"true" for "Тихое место 2" in "Тихое место 2 / A Quiet Place 2 (Джон Красински / John Krasinski) [2022, США, ужасы, фантастика, драма, HDTV 1080i] [Локализованный видеоряд] Dub (Пифагор) + Sub Rus [4.09 GB] (https://rutracker.org/forum/viewtopic.php?t=6015919)"', () => {
        expect(
            searchInData(
                "Тихое место 2",
                "Тихое место 2 / A Quiet Place 2 (Джон Красински / John Krasinski) [2022, США, ужасы, фантастика, драма, HDTV 1080i] [Локализованный видеоряд] Dub (Пифагор) + Sub Rus [4.09 GB] (https://rutracker.org/forum/viewtopic.php?t=6015919)"
            )
        ).toBeTruthy();
    });
});
