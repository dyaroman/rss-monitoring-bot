function searchInData(searchPhrase, originString) {
    const searchKeywords = prepareKeywordsFromString(searchPhrase);
    const originKeywords = prepareKeywordsFromString(originString);

    return searchKeywords.every(
        searchKeyword => originKeywords.indexOf(searchKeyword) > -1
    );
}

function prepareKeywordsFromString(string) {
    return string.trim().replace(/  +/gm, ' ').toLowerCase().split(' ');
}

module.exports = {searchInData, prepareKeywordsFromString};
