const supportedLanguages = ["fr", "en", "de", "es", "it", "ja", "ko", "zh-TW"];
const pageParams = new URLSearchParams(window.location.search);
const pageUrl = new URL(window.location);
let urlLang = pageUrl.searchParams.get("lang");

let locale;
let jData = {
    "proto" : {},
    "lsd" : {},
    "locale" : {},
    "custom" : {}
};

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
        this.preloadPromises = [];
        this.preloadScopes = [];
    }

    async fetchData(url, hasEntries = false, dataType = null, variableName = null) {
        const requestPromise = fetch(url)
            .then(async (response) => {
                const data = hasEntries ? (await response.json()).entries : await response.json();
                if(dataType && variableName) {
                    jData[dataType][variableName] = data;
                }
                return data;
            })
            .catch((error) => {
                throw error;
            });

        return requestPromise;
    }

    preloadPromise(url, dataType, variableName, hasEntries = true) {
        if(this.preloadScopes.includes(`${dataType}.${variableName}`) || Object.keys(jData[dataType]).includes(variableName)) {
            return;
        }

        const promise = this.fetchData(url, hasEntries, dataType, variableName);
        this.preloadScopes.push(`${dataType}.${variableName}`);
        this.preloadPromises.push(promise);
    }

    preloadProto(protoName, variableName = null, hasEntries = true) {
        variableName = variableName ? variableName : this.standardizeName(protoName);
        this.preloadPromise(`${this.baseDir}/data/proto/${protoName}.json`, "proto", variableName, hasEntries);
    }

    preloadLsd(lsdName, variableName = null, hasEntries = false) {
        variableName = variableName ? variableName : this.standardizeName(lsdName);
        this.preloadPromise(`${this.baseDir}/data/lsd/${lsdName}_${lng}.json`, "lsd", variableName, hasEntries);
    }

    preloadLocale(localeName, variableName = null, hasEntries = false) {
        variableName = variableName ? variableName : this.standardizeName(localeName);
        this.preloadPromise(`${this.baseDir}/data/locales/${lng}/${localeName}.json`, "locale", variableName, hasEntries);
    }

    preloadCustom(customName, variableName = null, hasEntries = true) {
        variableName = variableName ? variableName : this.standardizeName(customName);
        this.preloadPromise(`${this.baseDir}/data/custom/${customName}.json`, "custom", variableName, hasEntries);
    }

    standardizeName(name) {
        name = name.charAt(0).toLowerCase() + name.substring(1);
        let splitName = name.split(/[-_]+/);
        for(let i = 1; i < splitName.length; i++) {
            splitName[i] = splitName[i].charAt(0).toUpperCase() + splitName[i].substring(1);
            splitName[i] = splitName[i].replace(/_([a-z])/g, (match) => match.toUpperCase());
        }

        return splitName.join("");
    }

    async runPreload() {
        await Promise.all(this.preloadPromises);
        this.preloadScopes = [];
        this.preloadPromises = [];
    }
}

const jsonCache = new JsonCache();

let lng = locale === "zh-TW" ? "zh-TW" : locale.substring(0, 2);
if(!supportedLanguages.includes(lng)) lng = "en";

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
    jsonCache.preloadLocale("common");
    await jsonCache.runPreload();
}

async function buildHeader(baseDir = ".") {
    jsonCache.baseDir = baseDir;
    await getLocale();

    let headerData = [
        { "title": jData.locale.common.menu_schedule, "url": "", "drop": [
                { "title": jData.locale.common.submenu_schedule, "url": `${baseDir}/programme.html` },
                { "title" : jData.locale.common.submenu_gem_count, "url" : `${baseDir}/gems.html` },
            ] },
        { "title" : jData.locale.common.menu_sync_pairs, "url": "", "drop": [
                { "title" : jData.locale.common.submenu_pair_page, "url" : `${baseDir}/duo.html` },
                { "title": jData.locale.common.submenu_pair_ex_role, "url": `${baseDir}/ex-role.html` },
                { "title" : jData.locale.common.submenu_skill_gear, "url" : `${baseDir}/skill-gears.html` },
                { "title" : jData.locale.common.submenu_lucky_skills, "url" : `${baseDir}/lucky-skills.html` },
                { "title" : jData.locale.common.submenu_superawakening, "url" : `${baseDir}/superawakening.html` },
            ]
        },
        { "title": jData.locale.common.menu_battle_rally, "url": "", "drop": [
                { "title": jData.locale.common.submenu_rally_role_set, "url": `${baseDir}/rally/role-set.html` }
            ]
        },
        {
            "title": jData.locale.common.menu_language, "url": "", "drop": []
        }
    ];

    supportedLanguages.forEach(language => {
        let params = pageParams;
        params.delete("lang");
        params.append("lang", language);
        headerData[3]["drop"].push({ "title": jData.locale.common[`submenu_language`][`${language}`], "url": pageUrl.toString().split("?")[0] + "?" + params.toString(), "dataLang" : `${language}` });
    });

    let adminHeaderData = [
        { "title" : jData.locale.common.adminmenu_title, "url": "", "drop": [
                { "title" : jData.locale.common.adminsubmenu_discord, "url" : `${baseDir}/discord.html` },
                { "title" : jData.locale.common.adminsubmenu_eventRewards, "url" : `${baseDir}/progress-events.html` },
                { "title" : jData.locale.common.adminsubmenu_itemExchange, "url" : `${baseDir}/item-exchange.html` },
                { "title" : jData.locale.common.adminsubmenu_bingo, "url" : `${baseDir}/bingo.html` },
                { "title" : jData.locale.common.adminsubmenu_lodge, "url" : `${baseDir}/lodge.html` },
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
