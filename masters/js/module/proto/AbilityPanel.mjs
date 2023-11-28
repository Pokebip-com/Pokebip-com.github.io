import ProtoSingleton from "../ProtoSingleton.mjs";

class AbilityPanel extends ProtoSingleton {
    async constructor() {
        await super("AbilityPanel.json");

        console.log(this.data);
    }

    static getInstance() {
        if(!this.instance) {
            this.instance = new AbilityPanel();
        }

        return this.instance;
    }
}

const abilityPanel = AbilityPanel.getInstance();
export default abilityPanel;
