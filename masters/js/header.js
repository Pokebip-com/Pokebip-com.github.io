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
    { "title": "Programme", "url": "/masters/programme.html" },
    { "title" : "Duos", "url": "/masters/duo.html" },
    { "title": "Rôles EX", "url": "/masters/ex-role.html" },
    { "title": "Sets rôles Rallye", "url": "/masters/rally/role-set.html" },
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

let ul = document.createElement('ul');

headerData.forEach(hd => {
    var li = document.createElement('li');

    if(hd.url.split("/").pop() === currentUrl)
        li.classList.add("active");

    var a = document.createElement('a');
    a.setAttribute("href", `${hd.url}`);
    a.innerText = hd.title;

    li.appendChild(a);
    ul.appendChild(li);
});

headerBody.appendChild(ul);
body.appendChild(headerBody);
