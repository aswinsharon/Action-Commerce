const supportedLocales: string[] = [
    "en", "en-us", "en-gb", "en-nz", "en-au", "en-in", "de", "de-de", "fr", "fr-fr", "es", "es-es", "nl", "nl-nl",
    "hi", "it", "it-it", "pt", "pt-pt", "pt-br", "ru", "ru-ru", "pl", "pl-pl", "sv", "sv-se",
    "fi", "fi-fi", "da", "da-dk", "nb", "nb-no", "cs", "cs-cz", "sk", "sk-sk", "hu", "hu-hu",
    "tr", "tr-tr", "zh", "zh-cn", "zh-tw", "ja", "ja-jp", "ko", "ko-kr", "ar", "ar-sa"
];

// Helper: check if a locale is supported
function isValidLocale(locale: string) {
    return supportedLocales.includes(locale.toLowerCase());
}

// Helper: get the default locale
function getDefaultLocale() {
    return "en";
}

module.exports = {
    supportedLocales,
    isValidLocale,
    getDefaultLocale
};