import ProtoSingleton from "../ProtoSingleton.mjs";

class AbilityPanel extends ProtoSingleton {
    constructor() {
        super();
    }

    static async getInstance() {
        if(!this.instance) {
            this.instance = new AbilityPanel();
            await this.instance.fetchData(`AbilityPanel.json`);
        }

        return this.instance;
    }

    async fetchData(path)
    {
        if(!this.data) {
            await super.fetchData(path);
        }
    }
}


export default AbilityPanel;
