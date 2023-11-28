class Singleton {
    constructor() {

    }

    static getInstance() {
        if(!this.instance) {
            this.instance = new Singleton();
        }

        return this.instance;
    }
}

const singleton = Singleton.getInstance();
export default singleton;
