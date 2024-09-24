let lodgeTopicsDiv;

let salonGuest, salonGuestTopic, salonTopic, salonTopicName, salonTopicCategory;

let trainerNames, trainerVerboseNames, trainer, trainerBase;

async function getData() {
    await buildHeader();

    // PROTO
    jsonCache.preloadProto("SalonGuest");
    jsonCache.preloadProto("SalonGuestTopic");
    jsonCache.preloadProto("SalonTopic");

    // LSD
    jsonCache.preloadLsd("salon_topic");
    jsonCache.preloadLsd("salon_topic_category");

    // Preload utils
    preloadUtils();

    await jsonCache.runPreload();
}

function setLodgeTopics(guestId) {
    lodgeTopicsDiv.innerHTML = "";

    let points = [10, 7, 5];
    let appreciationEmojis = ["💗", "💖", "💔"];
    let topics = {};

    Object.keys(jData.lsd.salonTopicCategory).forEach(key => {
        topics[key] = {1: [], 2: [], 3: []};
    });

    jData.proto.salonGuestTopic.filter(sgt => sgt.salonGuestId === guestId).forEach(sgt => {
        let topic = jData.proto.salonTopic.find(st => st.salonTopicId === parseInt(sgt.topicId));
        topics[topic.salonTopicCategoryId][sgt.appreciation].push(topic);
    });

    let categoriesUl = document.createElement("ul");
    categoriesUl.classList.add("listh-bipcode");

    Object.keys(jData.lsd.salonTopicCategory).forEach(key => {
        let categoryLi = document.createElement("li");
        categoryLi.classList.add("listh-bipcode");
        categoryLi.style.textAlign = "left";
        categoryLi.style.padding = "0";

        let categoryTitle = document.createElement("h1");
        categoryTitle.innerText = jData.lsd.salonTopicCategory[key];
        categoryLi.appendChild(categoryTitle);

        let topicsDiv = document.createElement("div");
        topicsDiv.style.padding = "0.5em";
        categoryLi.appendChild(topicsDiv);

        Object.keys(topics[key]).forEach(appreciation => {
            topics[key][appreciation].forEach(topic => {
                let topicName = document.createElement("span");
                topicName.innerText = `${appreciationEmojis[appreciation-1]} ${jData.lsd.salonTopic[topic.salonTopicId].replace("\n", " ")} (${points[appreciation-1]} pts)`;
                topicsDiv.appendChild(topicName);
                topicsDiv.appendChild(document.createElement("br"));
            });
            if(topics[key][appreciation].length > 0) {
                topicsDiv.appendChild(document.createElement("br"));
            }
        });

        categoriesUl.appendChild(categoryLi);
    });

    lodgeTopicsDiv.appendChild(categoriesUl);
}

getData().then(() => {

    let salonGuestSelect = document.getElementById("salonGuestSelect");
    lodgeTopicsDiv = document.getElementById("lodgeTopicsDiv");

    jData.proto.salonGuest.map(sg => {
            return {"name": getTrainerName(sg.trainerId), "salonGuestId": sg.salonGuestId}
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(sg => {
            let option = new Option(sg.name, sg.salonGuestId);
            salonGuestSelect.appendChild(option);
        });

    salonGuestSelect.addEventListener("change", () => {
        let guestId = parseInt(salonGuestSelect.options[salonGuestSelect.selectedIndex].value);

        const url = new URL(window.location);
        url.searchParams.set('guestId', guestId + "");
        window.history.pushState(null, '', url.toString());

        setLodgeTopics(guestId);
    });

    const url = new URL(window.location);
    const guestId = url.searchParams.get('guestId');
    if (guestId !== null) {
        salonGuestSelect.value = guestId;
        setLodgeTopics(parseInt(guestId));
    } else {
        setLodgeTopics(parseInt(salonGuestSelect.options[salonGuestSelect.selectedIndex].value));
    }
});
