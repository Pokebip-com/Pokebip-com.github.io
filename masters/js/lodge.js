let lodgeTopicsDiv;

let salonGuest, salonGuestTopic, salonTopic, salonTopicName, salonTopicCategory;

let trainerNames, trainerVerboseNames, trainer, trainerBase;

async function getData() {
    await buildHeader();
    const [
        salonGuestResponse,
        salonGuestTopicResponse,
        salonTopicResponse,
        trainerResponse,
        trainerBaseResponse,
        salonTopicNameResponse,
        salonTopicCategoryResponse,
        trainerNameResponse,
        trainerVerboseNameResponse
    ] = await Promise.all([
        fetch("./data/proto/SalonGuest.json"),
        fetch("./data/proto/SalonGuestTopic.json"),
        fetch("./data/proto/SalonTopic.json"),
        fetch("./data/proto/Trainer.json"),
        fetch("./data/proto/TrainerBase.json"),
        fetch(`./data/lsd/salon_topic_${lng}.json`),
        fetch(`./data/lsd/salon_topic_category_${lng}.json`),
        fetch(`./data/lsd/trainer_name_${lng}.json`),
        fetch(`./data/lsd/trainer_verbose_name_${lng}.json`)
    ])
        .catch(error => console.log(error));

    salonGuest = (await salonGuestResponse.json()).entries;
    salonGuestTopic = (await salonGuestTopicResponse.json()).entries;
    salonTopic = (await salonTopicResponse.json()).entries;

    salonTopicName = await salonTopicNameResponse.json();
    salonTopicCategory = await salonTopicCategoryResponse.json();

    trainer = (await trainerResponse.json()).entries;
    trainerBase = (await trainerBaseResponse.json()).entries;
    trainerNames = await trainerNameResponse.json();
    trainerVerboseNames = await trainerVerboseNameResponse.json();
}

function setLodgeTopics(guestId) {
    lodgeTopicsDiv.innerHTML = "";

    let points = [10, 7, 5];
    let topics = {};

    Object.keys(salonTopicCategory).forEach(key => {
        topics[key] = {1: [], 2: [], 3: []};
    });

    salonGuestTopic.filter(sgt => sgt.salonGuestId === guestId).forEach(sgt => {
        let topic = salonTopic.find(st => st.salonTopicId === parseInt(sgt.topicId));
        topics[topic.salonTopicCategoryId][sgt.appreciation].push(topic);
    });

    Object.keys(salonTopicCategory).forEach(key => {
        let categoryTitle = document.createElement("h2");
        categoryTitle.innerText = salonTopicCategory[key];
        lodgeTopicsDiv.appendChild(categoryTitle);

        Object.keys(topics[key]).forEach(appreciation => {
            topics[key][appreciation].forEach(topic => {
                let topicName = document.createElement("span");
                topicName.innerText = `${salonTopicName[topic.salonTopicId].replace("\n", " ")} (${points[appreciation-1]} pts)`;
                lodgeTopicsDiv.appendChild(topicName);
                lodgeTopicsDiv.appendChild(document.createElement("br"));
            });
            lodgeTopicsDiv.appendChild(document.createElement("br"));
        });
    });
}

getData().then(() => {

    let salonGuestSelect = document.getElementById("salonGuestSelect");
    lodgeTopicsDiv = document.getElementById("lodgeTopicsDiv");

    salonGuest
        .map(sg => { return { "name": getTrainerName(sg.trainerId), "salonGuestId": sg.salonGuestId }})
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
    if(guestId !== null) {
        salonGuestSelect.value = guestId;
        setLodgeTopics(parseInt(guestId));
    }
    else {
        setLodgeTopics(parseInt(salonGuestSelect.options[salonGuestSelect.selectedIndex].value));
    }
});
