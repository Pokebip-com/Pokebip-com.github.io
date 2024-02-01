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

let body = document.getElementsByTagName("body")[0];
let headerData = [
    { "title": "Programme", "url": "/masters/programme.html", "drop": [] },
    { "title" : "Duos", "url": "", "drop": [
            { "title" : "Fiches", "url" : "/masters/duo.html" },
            { "title": "Rôles EX", "url": "/masters/ex-role.html" }
        ] },
    { "title": "Rallye", "url": "", "drop": [
            { "title": "Sets de rôles", "url": "/masters/rally/role-set.html" }
        ] },
];

let adminHeaderData = [
    { "title" : "Plateaux Duo-Gemme", "url": "/masters/sync-grids.html" },
];

const currentUrl = window.location.pathname.split("/").pop();
let isAdminMode = getCookie("admin");

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

headerData.forEach(hd => headerBody.appendChild(getSubnav(hd))
// {
//     let li = document.createElement('li');
//
//     if(hd.url.split("/").pop() === currentUrl)
//         li.classList.add("active");
//
//     var a = document.createElement('a');
//     a.setAttribute("href", `${hd.url}`);
//     a.innerText = hd.title;
//
//     li.appendChild(a);
//     ul.appendChild(li);
// }
);

// headerBody.appendChild(ul);
body.appendChild(headerBody);
