const supportedLanguages = ["fr", "en", "de", "es", "it", "ja", "ko", "zh-TW"];
const pageParams = new URLSearchParams(window.location.search);
const pageUrl = new URL(window.location);
let urlLang = pageUrl.searchParams.get("lang");

let locale;

switch(urlLang) {
    case "fr":
        locale = "fr-FR";
        setCookie("locale", "fr-FR", 8000);
        break;

    case "en":
        locale = "en-US";
        setCookie("locale", "en-US", 8000);
        break;

    case "de":
        locale = "de-DE";
        setCookie("locale", "de-DE", 8000);
        break;

    case "es":
        locale = "es-ES";
        setCookie("locale", "es-ES", 8000);
        break;

    case "it":
        locale = "it-IT";
        setCookie("locale", "it-IT", 8000);
        break;

    case "ja":
        locale = "ja-JP";
        setCookie("locale", "ja-JP", 8000);
        break;

    case "ko":
        locale = "ko-KR";
        setCookie("locale", "ko-KR", 8000);
        break;

    case "zh-TW":
        locale = "zh-TW";
        setCookie("locale", "zh-TW", 8000);
        break;

    default:
        locale = getCookie("locale") || navigator.language || navigator.userLanguage || "en-US";
        break;
}

class JsonCache {
    baseDir = ".";

    constructor() {
        this.cache = new Map();
        this.inProgressRequests = new Map();
        this.preloadPromises = [];
    }

    async getProto(protoName, hasEntries = true) {
        return this.fetchData(`${this.baseDir}/data/proto/${protoName}.json`, hasEntries);
    }

    async getLsd(lsdName, hasEntries = false) {
        return this.fetchData(`${this.baseDir}/data/lsd/${lsdName}_${lng}.json`, hasEntries);
    }

    async getLocale(localeName, hasEntries = false) {
        return this.fetchData(`${this.baseDir}/data/locales/${lng}/${localeName}.json`, hasEntries);
    }

    async getCustom(customName, hasEntries = false) {
        return this.fetchData(`${this.baseDir}/data/custom/${customName}.json`, hasEntries);
    }

    async fetchData(url, hasEntries = false) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        if (this.inProgressRequests.has(url)) {
            return this.inProgressRequests.get(url);
        }

        const requestPromise = fetch(url)
            .then(async (response) => {
                const data = hasEntries ? (await response.json()).entries : await response.json();
                this.cache.set(url, data);
                this.inProgressRequests.delete(url);
                return data;
            })
            .catch((error) => {
                this.inProgressRequests.delete(url);
                throw error;
            });

        this.inProgressRequests.set(url, requestPromise);

        return requestPromise;
    }

    preloadProto(protoName, storedVariable = null, hasEntries = true) {
        const url = `${this.baseDir}/data/proto/${protoName}.json`;
        const promise = this.fetchData(url, hasEntries);
        if (storedVariable) {
            promise.then(data => storedVariable = data);
        }
        this.preloadPromises.push(promise);
    }

    preloadLsd(lsdName, storedVariable = null, hasEntries = false) {
        const url = `${this.baseDir}/data/lsd/${lsdName}_${lng}.json`;
        const promise = this.fetchData(url, hasEntries);
        if (storedVariable) {
            promise.then(data => storedVariable = data);
        }
        this.preloadPromises.push(promise);
    }

    preloadLocale(localeName, storedVariable = null, hasEntries = false) {
        const url = `${this.baseDir}/data/locales/${lng}/${localeName}.json`;
        const promise = this.fetchData(url, hasEntries);
        if (storedVariable) {
            promise.then(data => storedVariable = data);
        }
        this.preloadPromises.push(promise);
    }

    preloadCustom(customName, storedVariable = null, hasEntries = false) {
        const url = `${this.baseDir}/data/custom/${customName}.json`;
        const promise = this.fetchData(url, hasEntries);
        if (storedVariable) {
            promise.then(data => storedVariable = data);
        }
        this.preloadPromises.push(promise);
    }

    runPreload() {
        return Promise.all(this.preloadPromises).then(() => {
            this.preloadPromises = [];
        });
    }
}

const jsonCache = new JsonCache();

let lng = locale === "zh-TW" ? "zh-TW" : locale.substring(0, 2);
if(!supportedLanguages.includes(lng)) lng = "en";
let commonLocales;

let body = document.getElementsByTagName("body")[0];
const currentUrl = window.location.pathname.split("/").pop();
let isAdminMode = getCookie("admin");

window.onpopstate = function(event) {
    let langElements = document.querySelectorAll('a[data-lang]');
    let params = new URLSearchParams(window.location.search);

    langElements.forEach(element => {
        params.delete("lang");
        params.append("lang", element.getAttribute("data-lang"));
        element.href = pageUrl.toString().split("?")[0] + "?" + params.toString();
    })
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;  SameSite=Lax";
}

function createNavEntry(url, title) {
    let a = document.createElement("a");
    a.href = url;
    a.innerText = title;

    if(url.split("/").pop() === currentUrl) {
        a.classList.add("active");
    }

    return a;
}

function getSubnav(data) {
    if(data["drop"].length === 0) {
        return createNavEntry(data.url, data.title);
    }

    let subnav = document.createElement('div');
    subnav.classList.add("subnav");

    let subnavBtn = document.createElement("button");
    subnavBtn.classList.add("subnavbtn")
    subnavBtn.innerHTML = `${data["title"]} <span class="material-symbols-outlined">arrow_drop_down</span>`;
    subnav.appendChild(subnavBtn);

    let subnavContent = document.createElement('div');
    subnavContent.classList.add("subnav-content");

    for(let i = 0; i < data["drop"].length; i++) {
        let a = createNavEntry(data["drop"][i].url, data["drop"][i].title);

        if(data["drop"][i].dataLang) {
            a.setAttribute("data-lang", data["drop"][i].dataLang);
        }

        if(a.classList.contains("active")) {
            subnav.classList.add("active");
        }

        subnavContent.appendChild(a);
    }

    subnav.appendChild(subnavContent);

    return subnav;

}

async function getLocale() {
    commonLocales = await jsonCache.getLocale("common");
}

async function buildHeader(baseDir = ".") {
    jsonCache.baseDir = baseDir;
    await getLocale();

    let headerData = [
        { "title": commonLocales.menu_schedule, "url": `${baseDir}/programme.html`, "drop": [] },
        { "title" : commonLocales.menu_sync_pairs, "url": "", "drop": [
                { "title" : commonLocales.submenu_pair_page, "url" : `${baseDir}/duo.html` },
                { "title": commonLocales.submenu_pair_ex_role, "url": `${baseDir}/ex-role.html` },
                { "title" : commonLocales.submenu_skill_gear, "url" : `${baseDir}/skill-gears.html` },
                { "title" : commonLocales.submenu_lucky_skills, "url" : `${baseDir}/lucky-skills.html` },
            ]
        },
        { "title": commonLocales.menu_battle_rally, "url": "", "drop": [
                { "title": commonLocales.submenu_rally_role_set, "url": `${baseDir}/rally/role-set.html` }
            ]
        },
        {
            "title": commonLocales.menu_language, "url": "", "drop": []
        }
    ];

    supportedLanguages.forEach(language => {
        let params = pageParams;
        params.delete("lang");
        params.append("lang", language);
        headerData[3]["drop"].push({ "title": commonLocales[`submenu_language`][`${language}`], "url": pageUrl.toString().split("?")[0] + "?" + params.toString(), "dataLang" : `${language}` });
    });

    let adminHeaderData = [
        { "title" : commonLocales.adminmenu_title, "url": "", "drop": [
                { "title" : commonLocales.adminsubmenu_discord, "url" : `${baseDir}/discord.html` },
                //{ "title" : commonLocales.adminsubmenu_eventRewards, "url" : `${baseDir}/progress-events.html` },
            ]
        }
    ];


    if(!isAdminMode) {
        isAdminMode = pageUrl.searchParams.get("admin");

        if (isAdminMode !== null || adminHeaderData.filter(ahd => ahd.url === currentUrl && ahd.giveAdmin !== null && ahd.giveAdmin === true).length > 0) {
            setCookie("admin", "true", 8000);
            isAdminMode = true;
        }
    }

    if(isAdminMode !== null) {
        headerData.push(...adminHeaderData);
    }

    let headerBody = document.createElement('div');
    headerBody.setAttribute('id', 'headerBody');
    headerBody.classList.add("navbar");

    let ul = document.createElement('ul');

    headerData.forEach(hd => headerBody.appendChild(getSubnav(hd)));

    body.appendChild(headerBody);

    body.style.marginTop = headerBody.offsetHeight + "px";
}
