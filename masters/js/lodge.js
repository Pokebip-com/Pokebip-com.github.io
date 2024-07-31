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
