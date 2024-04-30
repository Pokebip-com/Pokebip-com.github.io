let locale = navigator.language || navigator.userLanguage || "en-US";
locale = "en-US";
let lng = locale.substring(0, 2);
if(lng !== "fr" && lng !== "en") lng = "en";
let commonLocales;

let body = document.getElementsByTagName("body")[0];
const currentUrl = window.location.pathname.split("/").pop();
let isAdminMode = getCookie("admin");

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

        if(a.classList.contains("active")) {
            subnav.classList.add("active");
        }

        subnavContent.appendChild(a);
    }

    subnav.appendChild(subnavContent);

    return subnav;

}

async function getLocale(localePath) {
    let commonLocalesResponse = await fetch(`${localePath}${lng}/common.json`);
    commonLocales = await commonLocalesResponse.json();
}

async function buildHeader(localePath = "./data/locales/") {
    await getLocale(localePath);

    let headerData = [
        { "title": commonLocales.menu_schedule, "url": "/masters/programme.html", "drop": [] },
        { "title" : commonLocales.menu_sync_pairs, "url": "", "drop": [
                { "title" : commonLocales.submenu_pair_page, "url" : "/masters/duo.html" },
                { "title": commonLocales.submenu_pair_ex_role, "url": "/masters/ex-role.html" }
            ] },
        { "title": commonLocales.menu_battle_rally, "url": "", "drop": [
                { "title": commonLocales.submenu_rally_role_set, "url": "/masters/rally/role-set.html" }
            ] },
    ];

    let adminHeaderData = [
        { "title" : commonLocales.adminmenu_sync_grid, "url": "/masters/sync-grids.html", "drop": [] },
    ];


    if(!isAdminMode) {
        const url = new URL(window.location);
        isAdminMode = url.searchParams.get("admin");

        if (isAdminMode !== null || adminHeaderData.filter(ahd => ahd.url === currentUrl).length > 0) {
            document.cookie = "admin=true; expires Fri, 31 Dec 9999 21:10:10 GMT";
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
}
