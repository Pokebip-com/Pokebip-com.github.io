let lodgeTopicsDiv;

let salonGuest, salonGuestTopic, salonTopic, salonTopicName, salonTopicCategory;

let trainerNames, trainerVerboseNames, trainer, trainerBase;

async function getData() {
    await buildHeader();

    salonGuest = await jsonCache.getProto("SalonGuest");
    salonGuestTopic = await jsonCache.getProto("SalonGuestTopic");
    salonTopic = await jsonCache.getProto("SalonTopic");

    salonTopicName = await jsonCache.getLsd("salon_topic");
    salonTopicCategory = await jsonCache.getLsd("salon_topic_category");

    trainer = await jsonCache.getProto("Trainer");
    trainerBase = await jsonCache.getProto("TrainerBase");
    trainerNames = await jsonCache.getLsd("trainer_name");
    trainerVerboseNames = await jsonCache.getLsd("trainer_verbose_name");
}

function setLodgeTopics(guestId) {
    lodgeTopicsDiv.innerHTML = "";

    let points = [10, 7, 5];
    let appreciationEmojis = ["💗", "💖", "💔"];
    let topics = {};

    Object.keys(salonTopicCategory).forEach(key => {
        topics[key] = {1: [], 2: [], 3: []};
    });

    salonGuestTopic.filter(sgt => sgt.salonGuestId === guestId).forEach(sgt => {
        let topic = salonTopic.find(st => st.salonTopicId === parseInt(sgt.topicId));
        topics[topic.salonTopicCategoryId][sgt.appreciation].push(topic);
    });

    let categoriesUl = document.createElement("ul");
    categoriesUl.classList.add("listh-bipcode");

    Object.keys(salonTopicCategory).forEach(key => {
        let categoryLi = document.createElement("li");
        categoryLi.classList.add("listh-bipcode");
        categoryLi.style.textAlign = "left";
        categoryLi.style.padding = "0";

        let categoryTitle = document.createElement("h1");
        categoryTitle.innerText = salonTopicCategory[key];
        categoryLi.appendChild(categoryTitle);

        let topicsDiv = document.createElement("div");
        topicsDiv.style.padding = "0.5em";
        categoryLi.appendChild(topicsDiv);

        Object.keys(topics[key]).forEach(appreciation => {
            topics[key][appreciation].forEach(topic => {
                let topicName = document.createElement("span");
                topicName.innerText = `${appreciationEmojis[appreciation-1]} ${salonTopicName[topic.salonTopicId].replace("\n", " ")} (${points[appreciation-1]} pts)`;
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

getData().then(async () => {

    let salonGuestSelect = document.getElementById("salonGuestSelect");
    lodgeTopicsDiv = document.getElementById("lodgeTopicsDiv");

    (await Promise.all(salonGuest
        .map(async sg => {
            return {"name": await getTrainerName(sg.trainerId), "salonGuestId": sg.salonGuestId}
        })))
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
